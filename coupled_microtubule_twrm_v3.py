"""
SOVEREIGN COUPLED MICROTUBULE TWRM v3
======================================
First-principles rebuild from the v2 clean architecture.

E_G implementations:
  1. Point-mass (default):  E_G = G * m^2 / delta_x   [fast, ~100x under Hameroff]
  2. Pairwise cylindrical:  E_G = sum_{k<m} dipole_k * dipole_m / r_km
     Sourced from Sovereign_Math.py _calculate_penrose_self_energy().
     Uses real 13-PF cylindrical geometry (r=12nm, z-spacing=8nm).
  3. dimers_for_tau_sovereign(): 143-decimal Decimal precision from
     sovereign_universal_math_suite.py constants.

Preserved from v2:
  - Vocab-sized harmonic vector: cos(phase + vocab_phase) * alpha
  - Configurable n_protofilaments, omega, seed
  - @dataclass lattice state with __post_init__ validation
  - np.random.default_rng(seed) for reproducibility

Upgraded in v3:
  - vocab_phase tensor precomputed on GPU at init (configurable n_cycles)
  - B-lattice azimuthal offsets for n_protofilaments=13; generic linspace otherwise
  - 4D tesseract unit projection for interference phase
  - threading.Lock for concurrent generation stream safety
  - modulate() returns (np.ndarray, int, dict)
  - modulate_batch() for vectorised multi-position inference
  - get_twrm_engine() singleton accessor

References:
  Penrose (1996)            Gen. Rel. Grav. 28, 581-600
  Hameroff & Penrose (2014) Phys. Life Rev. 11, 39-78
  Wade et al. (1990)        J. Mol. Biol. 212, 775-786
"""


import math
import threading
import time
from dataclasses import dataclass, field
from typing import Optional, Tuple

import numpy as np
import torch

# ── Physical constants ─────────────────────────────────────────────────────────
HBAR                     = 1.054571817e-34   # J*s
G_NEWTON                 = 6.67430e-11       # m^3 kg^-1 s^-2
TUBULIN_MASS             = 1.827e-22         # kg  (110 kDa alpha-beta dimer)
SUPERPOSITION_SEPARATION = 1.0e-9            # m   (~1 nm GTP conformational shift)
BOLTZMANN                = 1.380649e-23      # J/K
TEMP_NEURAL              = 310.0             # K   (37 C)

# Gravitational self-energy of one dimer in superposition (Penrose 1996)
# E_G = G * m^2 / Δx
_EG_SINGLE        = G_NEWTON * (TUBULIN_MASS ** 2) / SUPERPOSITION_SEPARATION
_TAU_SINGLE_DIMER = HBAR / _EG_SINGLE   # ~47 s for one dimer; scales as 1/N


# ── B-lattice geometry ─────────────────────────────────────────────────────────
_SEAM_PF    = 0      # seam protofilament index (A/B lattice discontinuity)
_SEAM_SHIFT = 0.9    # rad  (~51.6 deg; Wade et al. 1990)


def _build_offsets(n_pf: int) -> np.ndarray:
    """
    Azimuthal phase offsets for each protofilament.

    For n_pf == 13: uses real 13-3 B-lattice geometry with seam correction.
    For other n_pf: generic uniform linspace (matches v2 behaviour).

    Returns shape (n_pf,) float64.
    """
    if n_pf == 13:
        step    = 2.0 * math.pi / 13
        offsets = np.array([k * step for k in range(13)], dtype=np.float64)
        offsets[_SEAM_PF] += _SEAM_SHIFT
    else:
        offsets = np.linspace(0.0, 2.0 * math.pi, n_pf, endpoint=False)
    return offsets


def _build_tesseract_phases(offsets: np.ndarray) -> np.ndarray:
    """
    Embeds n_pf protofilament phase angles into unit vectors on S^3 (R^4).

    v_k = (cos(theta_k), sin(theta_k), 0, sin(k*pi/N)) / norm

    Returns shape (n_pf, 4) float32.
    """
    n = len(offsets)
    phases = np.zeros((n, 4), dtype=np.float64)
    for k, theta in enumerate(offsets):
        phases[k, 0] = math.cos(theta)
        phases[k, 1] = math.sin(theta)
        phases[k, 2] = 0.0
        phases[k, 3] = math.sin(k * math.pi / n)
    norms = np.linalg.norm(phases, axis=1, keepdims=True) + 1e-15
    return (phases / norms).astype(np.float32)


# ── Quantum state dataclass ────────────────────────────────────────────────────

@dataclass
class OrchORState:
    """
    Full quantum state of the N-protofilament microtubule lattice.

    dipoles           (n_pf, lattice_length) in {-1.0, +1.0}
    coherence         float in [0.0, 1.0]
    collapse_threshold float threshold above which speculative depth boosts
    superposition     (n_pf,) per-protofilament amplitude in [0, 1]
    n_coherent_dimers int     dimers currently in collective superposition
    collapse_count    int     total objective reduction events
    e_g_total         float   derived: total gravitational energy (J)
    tau_collapse      float   derived: Orch-OR collapse time (s)
    """
    dipoles:           np.ndarray
    coherence:         float
    collapse_threshold: float        = 0.72
    superposition:     np.ndarray   = field(default=None)
    n_coherent_dimers: int           = 5000
    collapse_count:    int           = 0
    e_g_total:         float         = field(init=False)
    tau_collapse:      float         = field(init=False)

    def __post_init__(self):
        if self.dipoles.ndim != 2:
            raise ValueError(f"dipoles must be 2D, got {self.dipoles.ndim}D")
        self.coherence = float(np.clip(self.coherence, 0.0, 1.0))
        if self.superposition is None:
            self.superposition = np.full(self.dipoles.shape[0], self.coherence, dtype=np.float64)
        self._recompute_eg()

    def _recompute_eg(self):
        self.e_g_total   = self.n_coherent_dimers * _EG_SINGLE
        self.tau_collapse = (HBAR / self.e_g_total) if self.e_g_total > 0 else math.inf


# ── Main engine ────────────────────────────────────────────────────────────────

class CoupledMicrotubuleTWRM:
    """
    Sovereign Coupled Microtubule TWRM v3.

    Logit modulation:
        modulated = logits * decay + cos(phase + vocab_phase) * alpha

    where:
        phase       = 4D tesseract interference scalar (GPU)
        vocab_phase = 2*pi * arange(V) * n_cycles / V  (precomputed on GPU)
        alpha       = base_alpha * (1 + 1.8 * coherence^2.5) * thermal_factor
        decay       = exp(-0.0008 * (step % 64))

    Speculative depth returned as integer [1, max_speculative_depth], gated
    by Orch-OR coherence vs collapse_threshold.
    """

    SOVEREIGN_ANCHOR: float = 1.092777037037037   # Hz

    def __init__(
        self,
        sigma:                 float        = 1.092777037037037,
        base_alpha:            float        = 0.22,
        omega:                 float        = 0.012,
        n_protofilaments:      int          = 13,
        lattice_length:        int          = 100,
        n_vocab_cycles:        int          = 3,
        collapse_threshold:    float        = 0.72,
        max_speculative_depth: int          = 8,
        initial_coherence:     float        = 0.65,
        initial_n_dimers:      int          = 5000,
        # ── Collapse dynamics (tunable hyperparameters) ────────────────────
        # These are calibrated operational rates, not physics derivations.
        # p_collapse_per_step: probability of an OR event each modulate() call
        # coherence_drop:      (min, max) coherence lost on collapse
        # coherence_gain:      coherence recovered per step when not collapsing
        # dipole_flip_prob:    probability of a random dipole flip per step
        p_collapse_per_step:   float        = 0.08,
        coherence_drop:        tuple        = (0.10, 0.25),
        coherence_gain:        float        = 0.012,
        coherence_floor:       float        = 0.40,
        dipole_flip_prob:      float        = 0.03,
        # ── Physical tau gate (opt-in) ─────────────────────────────────────
        # With ~5k dimers, tau_OR ~ 9.47e9 ms (decorative).
        # Set use_physical_tau=True ONLY when n_coherent_dimers reaches
        # ~10^8-10^9+ and tau drops into the sub-second range.
        # dimers_for_tau(target_ms) tells you exactly what N you need.
        use_physical_tau:      bool         = False,
        seed:                  Optional[int] = None,
        device:                Optional[str] = None,
    ):
        """
        Args:
            sigma                  Sovereign anchor frequency (Hz).
            base_alpha             Base logit modulation amplitude.
            omega                  Protofilament angular frequency (rad/step).
            n_protofilaments       Number of protofilaments (13 = biological).
            lattice_length         Tubulin dimers per protofilament column.
            n_vocab_cycles         Sinusoidal cycles across the vocabulary.
            collapse_threshold     Coherence threshold for speculative boost.
            max_speculative_depth  Maximum speculative lookahead tokens.
            initial_coherence      Starting Orch-OR coherence [0, 1].
            initial_n_dimers       Dimers in collective superposition at start.
            p_collapse_per_step    Probability of OR collapse each call (default 0.08).
            coherence_drop         (min, max) coherence lost on collapse (default 0.10-0.25).
            coherence_gain         Coherence recovered per non-collapse step (default 0.012).
            coherence_floor        Minimum coherence after collapse (default 0.40).
            dipole_flip_prob       Probability of random dipole flip per step (default 0.03).
            seed                   RNG seed for reproducibility (None = random).
            device                 'cuda' | 'cpu' | None (auto-detect).
        """
        self.sigma              = sigma
        self.base_alpha         = base_alpha
        self.omega              = omega
        self.n_protofilaments   = n_protofilaments
        self.lattice_length     = lattice_length
        self.n_vocab_cycles     = n_vocab_cycles
        self.collapse_threshold = collapse_threshold
        self.max_spec_depth     = max_speculative_depth
        # Tunable collapse hyperparameters (restored from v2 calibration)
        self.p_collapse         = p_collapse_per_step
        self.coherence_drop     = coherence_drop
        self.coherence_gain     = coherence_gain
        self.coherence_floor    = coherence_floor
        self.dipole_flip_prob   = dipole_flip_prob
        self.use_physical_tau   = use_physical_tau

        # Seeded RNG for reproducibility (matches v2 np.random.default_rng pattern)
        self.rng = np.random.default_rng(seed)

        # Device
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)

        # Precompute immutable geometry tensors on GPU
        offsets              = _build_offsets(n_protofilaments)
        tesseract_phases     = _build_tesseract_phases(offsets)
        self._offsets_t      = torch.tensor(offsets,          dtype=torch.float32, device=self.device)
        self._phases_t       = torch.tensor(tesseract_phases, dtype=torch.float32, device=self.device)

        # Tight-binding Hamiltonian matrix for quantum walk across protofilaments
        self.H = np.zeros((n_protofilaments, n_protofilaments), dtype=np.complex128)
        for k in range(n_protofilaments):
            self.H[k, k] = self.sigma * (1.0 + 0.1 * math.sin(k * math.pi / n_protofilaments))
            next_k = (k + 1) % n_protofilaments
            self.H[k, next_k] = -0.15
            self.H[next_k, k] = -0.15

        # vocab_phase is built lazily (vocab_size unknown at init)
        self._vocab_size:    Optional[int]          = None
        self._vocab_phase_t: Optional[torch.Tensor] = None

        # Quantum state
        self._state: OrchORState = self._init_state(initial_coherence, initial_n_dimers)

        # Cached for get_stats() (set during modulate)
        self._last_alpha: float = base_alpha

        # Thread safety
        self._lock   = threading.Lock()
        self._last_t = time.perf_counter()

        # Cumulative counters
        self._n_modulations: int = 0
        self._n_collapses:   int = 0

        tau_ms = self._state.tau_collapse * 1e3
        print(
            f"[MicrotubuleTWRM v3] Initialized {n_protofilaments}-protofilament core | "
            f"sigma={self.sigma:.6f} | omega={omega} | "
            f"tau_OR={tau_ms:.3f}ms | device={self.device}"
        )

    # ── Init ───────────────────────────────────────────────────────────────────

    def _init_state(self, coherence: float, n_dimers: int) -> OrchORState:
        dipoles = self.rng.choice(
            np.array([-1.0, 1.0], dtype=np.float32),
            size=(self.n_protofilaments, self.lattice_length),
        )
        return OrchORState(
            dipoles=dipoles,
            coherence=coherence,
            collapse_threshold=self.collapse_threshold,
            n_coherent_dimers=n_dimers,
        )

    def _ensure_vocab_phase(self, vocab_size: int):
        """Lazily builds the vocab_phase tensor on GPU for the given vocab size."""
        if self._vocab_size != vocab_size:
            self._vocab_size = vocab_size
            vocab_idx = torch.arange(vocab_size, dtype=torch.float32, device=self.device)
            self._vocab_phase_t = 2.0 * math.pi * vocab_idx * self.n_vocab_cycles / vocab_size
            # shape: (vocab_size,)

    def evolve_quantum_walk(self, dt: float = 0.08, steps: int = 3) -> np.ndarray:
        """
        Schrödinger quantum walk evolution across protofilaments (dψ/dt = -i H ψ).
        Returns normalized probability distribution for superposition amplitudes.
        """
        psi = self._state.superposition.astype(np.complex128)
        norm = np.linalg.norm(psi)
        if norm > 0:
            psi /= norm
        for _ in range(steps):
            d_psi = -1j * np.dot(self.H, psi) * dt
            psi += d_psi
            norm = np.linalg.norm(psi)
            if norm > 0:
                psi /= norm
        return np.abs(psi) ** 2

    # ── 4D interference phase (GPU) ────────────────────────────────────────────

    def _compute_interference_phase(self, i: int) -> float:
        """
        4D tesseract interference phase across all protofilaments.

            phi_k = dipole[k, i%L] * (i * omega + offset_k)
            Psi_4D = sum_k( phi_k * sup_k * v_k )    in R4
            phase  = norm(Psi_4D)
        """
        idx = i % self.lattice_length

        dipole_col = torch.tensor(
            self._state.dipoles[:, idx],
            dtype=torch.float32, device=self.device
        )  # (n_pf,)

        sup = torch.tensor(
            self._state.superposition,
            dtype=torch.float32, device=self.device
        )  # (n_pf,)

        raw_phase = dipole_col * (i * self.omega + self._offsets_t)   # (n_pf,)
        weighted  = raw_phase * sup                                    # (n_pf,)
        psi_4d    = (self._phases_t * weighted.unsqueeze(1)).sum(0)   # (4,)

        return psi_4d.norm().item()

    # ── Adaptive alpha ─────────────────────────────────────────────────────────

    def _adaptive_alpha(self) -> float:
        """
        alpha = base_alpha * (1 + 1.8 * C^2.5) * (1 + 0.1 * eta)

        C   = Orch-OR coherence
        eta = thermal suppression: exp(-kT / hbar*omega)
        """
        C     = self._state.coherence
        boost = C ** 2.5
        kT    = BOLTZMANN * TEMP_NEURAL
        eta   = math.exp(min(0.0, -kT / (HBAR * self.omega + 1e-300)))
        return self.base_alpha * (1.0 + 1.8 * boost) * (1.0 + 0.1 * eta)

    # ── Speculative depth ──────────────────────────────────────────────────────

    def _speculative_depth(self) -> int:
        """Integer lookahead depth gated by objective reduction threshold."""
        C = self._state.coherence
        if C <= self.collapse_threshold:
            return 1
        excess = (C - self.collapse_threshold) / (1.0 - self.collapse_threshold)
        return 1 + int(excess * (self.max_spec_depth - 1))

    # ── Lattice evolution ──────────────────────────────────────────────────────

    # ── Sovereign pairwise E_G (from Sovereign_Math.py geometry) ──────────────

    def _calculate_penrose_self_energy_pairwise(self) -> float:
        """
        Pairwise dipole-dipole interaction E_G using actual cylindrical
        microtubule geometry from Sovereign_Math.py.

            E_G = sum_{k < m} (dipole_k * dipole_m) / (r_km + eps)

        where r_km is the 3D Euclidean distance between protofilament k and m
        in cylindrical coordinates (radius=12nm, z-spacing=8nm per dimer).

        Returns a dimensionless coherence-scaled energy proxy (same units as
        the collapse gate: compared against 4.5 * (1 - coherence)).
        """
        r_nm    = 12.0                                           # MT outer radius (nm)
        z_step  = 8.0                                            # dimer longitudinal pitch (nm)
        n_pf    = self.n_protofilaments
        theta   = np.linspace(0.0, 2.0 * math.pi, n_pf, endpoint=False)
        # Active layer: column 0 of dipole lattice
        dipoles = self._state.dipoles[:, 0]

        e_g = 0.0
        for k in range(n_pf):
            xk = r_nm * math.cos(theta[k])
            yk = r_nm * math.sin(theta[k])
            zk = k * z_step
            for m in range(k + 1, n_pf):
                xm = r_nm * math.cos(theta[m])
                ym = r_nm * math.sin(theta[m])
                zm = m * z_step
                dist = math.sqrt((xk-xm)**2 + (yk-ym)**2 + (zk-zm)**2)
                e_g += (dipoles[k] * dipoles[m]) / (dist + 1e-5)
        return abs(e_g)

    def sovereign_collapse_gate(self) -> bool:
        """
        Penrose collapse test using the pairwise cylindrical E_G.
        Returns True when objective reduction should fire:
            E_G > 4.5 * (1 - coherence)  AND  coherence > 0.5
        (Gate from Sovereign_Math.py _evolve_lattice)
        """
        e_g = self._calculate_penrose_self_energy_pairwise()
        threshold = 4.5 * (1.0 - self._state.coherence)
        return (e_g > threshold) and (self._state.coherence > 0.5)

    def dimers_for_tau_sovereign(self, target_ms: float) -> dict:
        """
        High-precision tau inversion using 143-decimal Decimal constants
        from sovereign_universal_math_suite.py.

            tau_N = hbar / (N * E_G_single)  =>  N = hbar / (tau * E_G_single)

        Returns dict with both point-mass and rigid-body-limit results.
        """
        from decimal import Decimal, getcontext
        getcontext().prec = 143

        HBAR_D = Decimal("1.054571817e-34")
        G_D    = Decimal("6.67430e-11")
        M_D    = Decimal("1.827e-22")     # 110 kDa tubulin dimer
        DX_D   = Decimal("1.0e-9")        # 1 nm superposition separation
        A_D    = Decimal("4.0e-9")        # ~4 nm protein radius (rigid-body limit)
        tau_D  = Decimal(str(target_ms)) / Decimal("1000")  # ms -> s

        # 1. Point-mass: E_G = G*m^2 / dx
        eg_point  = G_D * M_D * M_D / DX_D
        n_point   = HBAR_D / (tau_D * eg_point)

        # 2. Rigid-body small-displacement: E_G = G*m^2 * dx^2 / a^3
        eg_rigid  = G_D * M_D * M_D * DX_D * DX_D / (A_D ** 3)
        n_rigid   = HBAR_D / (tau_D * eg_rigid)

        return {
            "target_ms":       target_ms,
            "eg_point_J":      float(eg_point),
            "n_point_dimers":  int(n_point),
            "eg_rigid_J":      float(eg_rigid),
            "n_rigid_dimers":  int(n_rigid),
            "precision_digits": 143,
        }

    def dimers_for_tau(self, target_ms: float) -> int:
        """
        Returns the number of coherent dimers required for tau_OR to equal
        target_ms milliseconds.

        Example:
            engine.dimers_for_tau(25)   # dimers needed for 25ms collapse window
            engine.dimers_for_tau(1)    # dimers needed for 1ms collapse window
        """
        target_s  = target_ms / 1e3
        # tau_N = hbar / (N * E_G_single)  =>  N = hbar / (tau_target * E_G_single)
        n = HBAR / (target_s * _EG_SINGLE)
        return int(math.ceil(n))

    def _evolve_lattice(self) -> None:
        """
        Orch-OR lattice evolution driven by pairwise E_G geometry,
        tight-binding Hamiltonian quantum walk, and Fröhlich condensation.
        """
        self._state._recompute_eg()

        # Update Hamiltonian diagonal with thermal fluctuation detuning
        t_now = time.perf_counter()
        thermal_detuning = 0.05 * math.cos(2.0 * math.pi * self.sigma * t_now)
        for k in range(self.n_protofilaments):
            self.H[k, k] = self.sigma * (1.0 + 0.1 * math.sin(k * math.pi / self.n_protofilaments)) + thermal_detuning

        # Quantum walk evolution (Schrödinger equation dψ/dt = -i H ψ)
        walk_probs = self.evolve_quantum_walk(dt=0.08, steps=3)
        self._state.superposition = np.clip(walk_probs, 0.1, 1.0)

        # Check collapse condition (Sovereign pairwise gate OR calibrated rate)
        sovereign_collapse = self.sovereign_collapse_gate()
        calibrated_collapse = (self.rng.random() < self.p_collapse)

        if sovereign_collapse or calibrated_collapse:
            drop = self.rng.uniform(*self.coherence_drop)
            self._state.coherence        = max(self.coherence_floor, self._state.coherence - drop)
            self._state.collapse_count  += 1
            self._n_collapses           += 1
            loss = int(self.rng.integers(100, 400))
            self._state.n_coherent_dimers = max(200, self._state.n_coherent_dimers - loss)
            self._state.superposition   *= self.rng.uniform(0.65, 0.90, size=self.n_protofilaments)
        else:
            # Fröhlich condensation build-up towards coherence threshold
            growth = 0.015 * (1.0 - self._state.coherence)
            self._state.coherence         = min(0.98, self._state.coherence + growth)
            self._state.n_coherent_dimers = min(50_000, self._state.n_coherent_dimers + 50)

        if self.rng.random() < self.dipole_flip_prob:
            k   = self.rng.integers(0, self.n_protofilaments)
            idx = self.rng.integers(0, self.lattice_length)
            self._state.dipoles[k, idx] *= -1.0

    # ── Public API ─────────────────────────────────────────────────────────────

    def modulate(
        self,
        logits: np.ndarray,
        i:      int,
    ) -> Tuple[np.ndarray, int, dict]:
        """
        Full Orch-OR coupled TWRM v3 modulation.

            modulated = logits * decay + cos(phase + vocab_phase) * alpha

        Args:
            logits  Raw logit vector, shape (..., vocab_size), float32.
            i       Generation step index.

        Returns:
            modulated_logits  Same shape as logits.
            speculative_depth Integer in [1, max_speculative_depth].
            meta              Introspection dict.
        """
        vocab_size = logits.shape[-1]
        now = time.perf_counter()

        with self._lock:
            elapsed      = now - self._last_t
            self._last_t = now

            self._evolve_lattice()
            self._ensure_vocab_phase(vocab_size)

            phase = self._compute_interference_phase(i)
            alpha = self._adaptive_alpha()
            decay = math.exp(-0.0008 * (i % 64))

            self._last_alpha = alpha

            # Vocab-phase harmonic vector (GPU)
            # harmonic_vec[v] = cos(phase + vocab_phase[v]) * alpha
            harmonic_vec = torch.cos(phase + self._vocab_phase_t) * alpha   # (V,)

            logits_t  = torch.tensor(logits, dtype=torch.float32, device=self.device)
            modulated = logits_t * decay + harmonic_vec

            depth = self._speculative_depth()
            self._n_modulations += 1

            meta = {
                "coherence":          round(self._state.coherence, 5),
                "adaptive_alpha":     round(alpha, 5),
                "phase_4d":           round(phase, 5),
                "decay":              round(decay, 5),
                "tau_collapse_ms":    round(self._state.tau_collapse * 1e3, 3),
                "e_g_joules":         f"{self._state.e_g_total:.4e}",
                "n_coherent_dimers":  self._state.n_coherent_dimers,
                "collapse_count":     self._state.collapse_count,
                "speculative_depth":  depth,
                "device":             str(self.device),
                "step":               i,
            }

        return modulated.cpu().numpy(), depth, meta

    def modulate_batch(
        self,
        logits_batch: np.ndarray,   # (B, vocab_size)
        steps:        np.ndarray,   # (B,) int
    ) -> Tuple[np.ndarray, np.ndarray, dict]:
        """
        Vectorised batch modulation. Snapshots state once, applies per-step phase.

        Returns:
            modulated_batch  (B, vocab_size) float32
            depths           (B,) int32
            meta             stats dict
        """
        B          = logits_batch.shape[0]
        vocab_size = logits_batch.shape[1]
        out        = np.empty_like(logits_batch)
        depths     = np.empty(B, dtype=np.int32)

        now = time.perf_counter()
        with self._lock:
            elapsed      = now - self._last_t
            self._last_t = now
            self._evolve_lattice()
            self._ensure_vocab_phase(vocab_size)

            alpha_snap = self._adaptive_alpha()
            depth_snap = self._speculative_depth()
            logits_t   = torch.tensor(logits_batch, dtype=torch.float32, device=self.device)

            for b in range(B):
                phase        = self._compute_interference_phase(int(steps[b]))
                decay        = math.exp(-0.0008 * (int(steps[b]) % 64))
                harmonic_vec = torch.cos(phase + self._vocab_phase_t) * alpha_snap
                out[b]       = (logits_t[b] * decay + harmonic_vec).cpu().numpy()
                depths[b]    = depth_snap

            self._n_modulations += B
            meta = self.get_stats()

        return out, depths, meta

    def get_stats(self) -> dict:
        """Current engine stats snapshot."""
        self._state._recompute_eg()
        tau_ms   = self._state.tau_collapse * 1e3
        tau_label = (
            f"{tau_ms:.3f}ms [ACTIVE]"
            if (self.use_physical_tau and tau_ms < 1000.0)
            else f"{tau_ms:.3e}ms [decorative — need {self.dimers_for_tau(25):,.0f} dimers for 25ms]"
        )
        return {
            "coherence":          round(self._state.coherence, 4),
            "adaptive_alpha":     round(self._last_alpha, 4),
            "collapse_threshold": self._state.collapse_threshold,
            "tau_OR":             tau_label,
            "p_collapse_active":  (
                f"physical (tau={tau_ms:.1f}ms)"
                if (self.use_physical_tau and tau_ms < 1000.0)
                else f"calibrated ({self.p_collapse:.2f}/step)"
            ),
            "n_coherent_dimers":  self._state.n_coherent_dimers,
            "total_collapses":    self._n_collapses,
            "total_modulations":  self._n_modulations,
            "speculative_depth":  self._speculative_depth(),
            "device":             str(self.device),
            "status":             "V3 ORCH-OR 4D-TESSERACT B-LATTICE RESONANCE",
        }

    def force_collapse(self) -> None:
        """Manually trigger an objective reduction event."""
        with self._lock:
            self._state.coherence       = max(0.40, self._state.coherence - 0.30)
            self._state.collapse_count += 1
            self._n_collapses          += 1
            self._state._recompute_eg()

    def reset_state(self, coherence: float = 0.65, n_dimers: int = 5000) -> None:
        """Reset quantum state to a fresh lattice."""
        with self._lock:
            self._state  = self._init_state(coherence, n_dimers)
            self._last_t = time.perf_counter()
        print(f"[MicrotubuleTWRM v3] State reset | coherence={coherence} | n_dimers={n_dimers:,}")


# ── Singleton ──────────────────────────────────────────────────────────────────

_engine_instance: Optional[CoupledMicrotubuleTWRM] = None


def get_twrm_engine(**kwargs) -> CoupledMicrotubuleTWRM:
    """Process-global singleton. Constructed on first call with kwargs."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = CoupledMicrotubuleTWRM(**kwargs)
    return _engine_instance


# ── Validation ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 62)
    print("  SOVEREIGN COUPLED MICROTUBULE TWRM v3 -- VALIDATION")
    print("=" * 62)

    # Matches v2 test exactly (seed=42, same logits rng)
    engine = CoupledMicrotubuleTWRM(base_alpha=0.25, seed=42)

    sim_logits = np.random.default_rng(0).standard_normal(32000).astype(np.float32) * 3.5

    modulated, depth, meta = engine.modulate(sim_logits, i=142)

    print(f"\nCoherence:                   {engine._state.coherence:.4f}")
    print(f"Adaptive alpha:              {engine.get_stats()['adaptive_alpha']:.4f}")
    print(f"Collapse-gated spec. depth:  {depth}  (was bool in v2)")
    print(f"Vocab harmonic shape:        {modulated.shape}  (vs scalar in original v1)")
    print(f"Device:                      {meta['device']}")

    print("\n--- 100-STEP EVOLUTION ---")
    seen = 0
    for i in range(100):
        lgt = np.random.default_rng(i).standard_normal(32000).astype(np.float32) * 3.5
        _, d, m = engine.modulate(lgt, i=i)
        if m["collapse_count"] > seen:
            seen = m["collapse_count"]
            print(
                f"  [step {i:3d}] OR EVENT #{seen:2d} | "
                f"coh={m['coherence']:.4f} | "
                f"depth={d} | "
                f"tau={m['tau_collapse_ms']:.3f}ms"
            )

    print("\n--- BATCH (B=5) ---")
    batch = np.stack([
        np.random.default_rng(b).standard_normal(32000).astype(np.float32) * 3.5
        for b in range(5)
    ])
    out_b, d_b, _ = engine.modulate_batch(batch, np.arange(5))
    print(f"  Output shape: {out_b.shape} | depths: {d_b.tolist()}")

    print("\n--- FINAL STATS ---")
    for k, v in engine.get_stats().items():
        print(f"  {k:<26} {v}")
