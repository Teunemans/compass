// Settings Teun can change without touching the app code.
window.COMPASS_CONFIG = {
  owner: "Teun",
  ownerX: "Teunemansvb",          // X handle for removal requests and questions (without @)

  // Labels on the balls, by name, replacing the label people chose themselves (max 3 letters/digits).
  labelOverrides: {
    "Riley": "Ry"
  },

  // Google Form "Compass results" that receives results; responses go to the Sheet
  // "Compass results (responses)" in Teun's Drive. Leave action empty to switch sending off;
  // the page then only shows the copy-your-code route. See README.md for how to fill this in.
  form: {
    action:  "https://docs.google.com/forms/d/e/1FAIpQLSdhGjk5gZU2iKTLOySZ2XgIn_H2YfJd3Ck0-w5SmGr9tNgTOg/formResponse",
    code:    "entry.641649571",   // question "code"
    kind:    "entry.264842407",   // question "kind": add or remove
    key:     "entry.941713902",   // question "key": random removal key
    consent: "entry.1230529788"   // question "consent": what they agreed to, and when
  }
};
