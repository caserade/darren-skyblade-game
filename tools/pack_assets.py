"""Re-pack the model and music into assets/*.js after you change them.

    python tools/pack_assets.py path/to/darren.glb path/to/music.mp3

Either argument can be '-' to keep the current file. The game reads these as base64 strings
(window.DARREN_MODEL_B64 / window.DARREN_MUSIC_B64) so it also works when opened as a plain file.
"""
import base64, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def pack(src, out, var, note):
    data = base64.b64encode(pathlib.Path(src).read_bytes()).decode("ascii")
    (ROOT / "assets" / out).write_text('/* %s */\nwindow.%s = "%s";\n' % (note, var, data), encoding="ascii")
    print("wrote", out, len(data) // 1024, "KB")


if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else "-"
    music = sys.argv[2] if len(sys.argv) > 2 else "-"
    if model != "-":
        pack(model, "darren_model.js", "DARREN_MODEL_B64", "Darren, rigged in Blender (darren game asset.blend -> darren.glb), base64")
    if music != "-":
        pack(music, "music.js", "DARREN_MUSIC_B64", "Level music (MP3), base64")
