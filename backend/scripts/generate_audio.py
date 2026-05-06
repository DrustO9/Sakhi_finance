"""
Generate WAV audio for every psychometric question in EN + HI.

Uses eSpeak NG (open source, Apache-2.0, supports 100+ languages including Hindi).
Install:
  - Linux:   apt install espeak-ng
  - macOS:   brew install espeak-ng
  - Windows: download installer from https://github.com/espeak-ng/espeak-ng/releases

If espeak-ng is missing, this script writes silent placeholder WAVs so the
frontend audio elements still resolve. Replace with Piper TTS for production.
"""
from __future__ import annotations

import json
import shutil
import struct
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import AUDIO_DIR, DATA_DIR


def _silent_wav(path: Path, seconds: float = 0.5, sr: int = 22050) -> None:
    n_samples = int(seconds * sr)
    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + n_samples * 2))
        f.write(b"WAVEfmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, sr, sr * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", n_samples * 2))
        f.write(b"\x00\x00" * n_samples)


def _espeak_say(text: str, out_path: Path, voice: str) -> bool:
    espeak = shutil.which("espeak-ng") or shutil.which("espeak")
    if not espeak:
        return False
    try:
        subprocess.run(
            [espeak, "-v", voice, "-s", "140", "-w", str(out_path), text],
            check=True, capture_output=True, timeout=20,
        )
        return out_path.exists() and out_path.stat().st_size > 100
    except Exception:
        return False


def main() -> None:
    bank = json.loads((DATA_DIR / "psychometric_questions.json").read_text(encoding="utf-8"))
    voices = {"en": "en", "hi": "hi"}
    have_espeak = bool(shutil.which("espeak-ng") or shutil.which("espeak"))
    if not have_espeak:
        print("WARNING: espeak-ng not found. Writing silent placeholder WAVs.")
        print("Install espeak-ng for real audio. (apt/brew install espeak-ng)")

    for lang in ("en", "hi"):
        out_dir = AUDIO_DIR / lang
        out_dir.mkdir(parents=True, exist_ok=True)
        for q in bank["questions"]:
            text = q["prompts"][lang]
            options_text = " ".join(opt[lang] for opt in q["options"].values())
            full = f"{text}. Options: {options_text}"
            out_path = out_dir / f"{q['id']}.wav"
            ok = _espeak_say(full, out_path, voices[lang]) if have_espeak else False
            if not ok:
                _silent_wav(out_path)
            print(f"  [{lang}] {q['id']}.wav  ({'eSpeak' if ok else 'silent'})")


if __name__ == "__main__":
    main()
