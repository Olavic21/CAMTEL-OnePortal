import pathlib

p = pathlib.Path(r"C:\Users\HP PROBOOK 450 G2\CAMTEL-OnePortal\CAMTEL-OnePortal\backend\apps\core\tests.py")
lines = p.read_text().split("\n")

# Line 122 (0-indexed 121) should be the @override_settings decorator
# at 4-space indentation (method level inside the class).
old = lines[121]
new = (
    "    @override_settings("
    "CHATBOT_PROVIDER='mock', "
    "CHATBOT_MODEL='mock-gpt', "
    "CHATBOT_ENABLED=True, "
    "CHATBOT_FALLBACK_TO_SEARCH=True)"
)
lines[121] = new
p.write_text("\n".join(lines))

print("OLD:", repr(old[:25]))
print("NEW:", repr(new[:25]))