/* Drops payload decoder. Runs entirely in your browser.
   Nothing you paste is transmitted, stored or logged. There is no network
   call in this file and no persistence of input. */
(function () {
  "use strict";

  var MARKERS = { drops: "artifact", "drops-pact": "Pact Seed record" };
  var CARRIER_MARKER = "bip110-op-drop";
  var MIME_RE = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/;
  var P = (1n << 256n) - (1n << 32n) - 977n;

  /* ---- helpers -------------------------------------------------------- */

  function hexToBytes(hex) {
    var clean = hex.replace(/^0x/i, "").replace(/[\s:,]/g, "");
    if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2) return null;
    var out = new Uint8Array(clean.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
    return out;
  }

  function toHex(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
    return s;
  }

  function ascii(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) {
      var c = bytes[i];
      s += c >= 0x20 && c <= 0x7e ? String.fromCharCode(c) : ".";
    }
    return s;
  }

  function utf8(bytes) {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
    catch (e) { return null; }
  }

  function sha256(bytes) {
    return crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
      return new Uint8Array(buf);
    });
  }

  function powMod(base, exp, mod) {
    var result = 1n;
    base %= mod;
    while (exp > 0n) {
      if (exp & 1n) result = (result * base) % mod;
      base = (base * base) % mod;
      exp >>= 1n;
    }
    return result;
  }

  /* An x-only key is valid when x < p and x^3 + 7 is a quadratic residue. */
  function isXOnlyPoint(bytes) {
    if (bytes.length !== 32) return false;
    var x = BigInt("0x" + toHex(bytes));
    if (x === 0n || x >= P) return false;
    var y2 = (powMod(x, 3n, P) + 7n) % P;
    if (y2 === 0n) return false;
    return powMod(y2, (P - 1n) / 2n, P) === 1n;
  }

  /* ---- script parsing ------------------------------------------------- */

  function readPush(bytes, i) {
    var op = bytes[i];
    var len, start, prefix;
    /* OP_0 pushes a zero-length element. It parses as a push so that the body
       length rule reports the real problem rather than a structural one. */
    if (op === 0x00) { len = 0; start = i + 1; prefix = 1; }
    else if (op >= 0x01 && op <= 0x4b) { len = op; start = i + 1; prefix = 1; }
    else if (op === 0x4c) { if (i + 1 >= bytes.length) return null; len = bytes[i + 1]; start = i + 2; prefix = 2; }
    else if (op === 0x4d) { if (i + 2 >= bytes.length) return null; len = bytes[i + 1] | (bytes[i + 2] << 8); start = i + 3; prefix = 3; }
    else return null;
    if (start + len > bytes.length) return null;
    return { data: bytes.subarray(start, start + len), next: start + len, op: op, prefix: prefix };
  }

  function minimalOpcodeFor(data) {
    if (data.length === 0) return null;
    if (data.length === 1) {
      var v = data[0];
      if (v === 0x81 || (v >= 0x01 && v <= 0x10)) return "none";
      return 0x01;
    }
    if (data.length <= 0x4b) return data.length;
    if (data.length <= 0xff) return 0x4c;
    if (data.length <= 0xffff) return 0x4d;
    return null;
  }

  var FIELDS = ["marker", "content type", "body hash", "body", "creator key"];
  var OPS = [0x75, 0x75, 0x75, 0x75, 0xac];
  var OPNAMES = ["OP_DROP", "OP_DROP", "OP_DROP", "OP_DROP", "OP_CHECKSIG"];

  function parseLeaf(bytes) {
    var i = 0;
    var pushes = [];
    for (var f = 0; f < 5; f++) {
      var p = readPush(bytes, i);
      if (!p) return { ok: false, error: "Field " + (f + 1) + " (" + FIELDS[f] + ") is not a data push. Rule D-3." };
      if (p.next >= bytes.length) return { ok: false, error: "Script ended before the opcode following the " + FIELDS[f] + " push. Rule D-1." };
      if (bytes[p.next] !== OPS[f]) {
        return { ok: false, error: "Expected " + OPNAMES[f] + " after the " + FIELDS[f] + " push, found byte 0x" + bytes[p.next].toString(16).padStart(2, "0") + ". Rule D-2." };
      }
      pushes.push(p);
      i = p.next + 1;
    }
    if (i !== bytes.length) {
      return { ok: false, error: "Script has " + (bytes.length - i) + " trailing byte(s) after OP_CHECKSIG. A Drops leaf is exactly ten chunks. Rule D-1." };
    }
    return { ok: true, pushes: pushes };
  }

  /* Locate a Drops leaf inside a larger blob, for example a raw transaction. */
  function findLeaf(bytes) {
    var candidates = [];
    Object.keys(MARKERS).concat([CARRIER_MARKER]).forEach(function (m) {
      var pat = [m.length];
      for (var k = 0; k < m.length; k++) pat.push(m.charCodeAt(k));
      pat.push(0x75);
      candidates.push(pat);
    });
    for (var i = 0; i < bytes.length; i++) {
      for (var c = 0; c < candidates.length; c++) {
        var pat = candidates[c], match = true;
        for (var j = 0; j < pat.length; j++) {
          if (bytes[i + j] !== pat[j]) { match = false; break; }
        }
        if (!match) continue;
        for (var end = bytes.length; end > i; end--) {
          var slice = bytes.subarray(i, end);
          if (slice[slice.length - 1] !== 0xac) continue;
          if (parseLeaf(slice).ok) return { offset: i, bytes: slice };
        }
      }
    }
    return null;
  }

  /* ---- Pact body profiles --------------------------------------------- */

  var NETWORKS = ["mainnet", "testnet", "signet", "regtest"];
  var FLOORS = ["recorded", "co-signed", "template-enforced"];

  function decodeSeed(body) {
    if (body.length !== 184) return { error: "A Pact Seed record is exactly 184 bytes; this body is " + body.length + "." };
    if (ascii(body.subarray(0, 4)) !== "DPSE") return { error: "Seed magic is not DPSE." };
    if (body[4] !== 0 || body[7] !== 0) return { error: "Seed reserved bytes at offsets 4 and 7 must both be zero." };
    var net = NETWORKS[body[5]], floor = FLOORS[body[6]];
    if (!net) return { error: "Unknown network tag " + body[5] + "." };
    if (!floor) return { error: "Unknown enforcement floor tag " + body[6] + "." };
    var raw = body.subarray(8, 24), zero = raw.indexOf(0);
    var idBytes = zero === -1 ? raw : raw.subarray(0, zero);
    if (zero !== -1) {
      for (var k = zero; k < raw.length; k++) if (raw[k] !== 0) return { error: "Engine identifier padding must be zero." };
    }
    var engineId = ascii(idBytes);
    if (!/^[a-z][a-z0-9-]{0,15}$/.test(engineId)) return { error: "Engine identifier does not match ^[a-z][a-z0-9-]{0,15}$." };
    return {
      network: net,
      enforcementFloor: floor,
      engineId: engineId,
      rulesetHash: toHex(body.subarray(24, 56)),
      abiHash: toHex(body.subarray(56, 88)),
      genesisStateRoot: toHex(body.subarray(88, 120)),
      policyRoot: toHex(body.subarray(120, 152)),
      dataAvailabilityPolicyHash: toHex(body.subarray(152, 184))
    };
  }

  function decodeReference(body) {
    var text = utf8(body);
    if (text === null) return { error: "Body is not valid UTF-8." };
    var value;
    try { value = JSON.parse(text); } catch (e) { return { error: "Body is not valid JSON." }; }
    if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Body is not a JSON object." };
    var keys = Object.keys(value).sort().join(",");
    if (keys !== "bh,p,ph,t") return { error: "Keys must be exactly bh, p, ph and t. Found: " + (keys || "none") + "." };
    if (value.p !== "pacts") return { error: 'Field p must be exactly "pacts".' };
    if (!/^[a-z][a-z0-9-]{0,40}$/.test(String(value.t))) return { error: "Template id does not match ^[a-z][a-z0-9-]{0,40}$." };
    if (!/^[0-9a-f]{64}$/.test(String(value.ph))) return { error: "Plan hash must be 64 lowercase hex characters." };
    if (!/^[0-9a-f]{64}$/.test(String(value.bh))) return { error: "Blueprint hash must be 64 lowercase hex characters." };
    var rebuilt = JSON.stringify({ bh: value.bh, p: "pacts", ph: value.ph, t: value.t });
    if (rebuilt !== text) return { error: "Body is not in the required serialization. Keys must be in sorted order with no whitespace." };
    return { template: value.t, planHash: value.ph, blueprintHash: value.bh };
  }

  /* ---- rendering ------------------------------------------------------ */

  var out = document.getElementById("decoder-result");

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function verdict(kind, text) {
    var cls = kind === "ok" ? "is-ok" : kind === "warn" ? "is-warn" : "is-bad";
    return '<p class="result__verdict ' + cls + '">' + esc(text) + "</p>";
  }

  function row(name, value, note) {
    return '<li><span class="fname">' + esc(name) + '</span><span class="fval">' + esc(value) + "</span>" +
      (note ? '<span class="fnote">' + note + "</span>" : "") + "</li>";
  }

  function fail(message) {
    out.innerHTML = verdict("bad", "Not a Drops leaf") +
      '<p class="fnote">' + esc(message) + "</p>" +
      '<p class="fnote">Every condition in the specification is a hard rejection. There is no partial acceptance. See <a href="drops-specification.html#invalid">invalid conditions</a>.</p>';
  }

  function render(leaf, offset, total) {
    var pushes = leaf.pushes;
    var marker = ascii(pushes[0].data);
    var mime = ascii(pushes[1].data);
    var hash = pushes[2].data;
    var body = pushes[3].data;
    var key = pushes[4].data;
    var problems = [];

    /* minimal push encoding, rule D-4 and D-15 */
    for (var f = 0; f < 5; f++) {
      var want = minimalOpcodeFor(pushes[f].data);
      if (want === "none") {
        problems.push("The " + FIELDS[f] + " is a single byte with no minimal data-push encoding (0x81, or 0x01 to 0x10). Rule D-15.");
      } else if (want === null) {
        problems.push("The " + FIELDS[f] + " push is empty. Rule D-14.");
      } else if (pushes[f].op !== want) {
        problems.push("The " + FIELDS[f] + " uses a non-minimal push opcode 0x" + pushes[f].op.toString(16) +
          "; the minimal encoding is 0x" + want.toString(16) + ". Rule D-4.");
      }
    }

    if (marker === CARRIER_MARKER) {
      problems.push("Marker " + CARRIER_MARKER + " belongs to the OP_DROP token protocol, not to Drops. A Drops indexer must reject it. Rule D-7.");
    } else if (!MARKERS[marker]) {
      problems.push("Marker " + JSON.stringify(marker) + " is not a Drops marker. Only drops and drops-pact are accepted. Rule D-6.");
    }

    if (pushes[1].data.length > 80) problems.push("Content type is " + pushes[1].data.length + " bytes; the maximum is 80. Rule D-9.");
    for (var m = 0; m < pushes[1].data.length; m++) {
      if (pushes[1].data[m] > 0x7e || pushes[1].data[m] < 0x20) { problems.push("Content type contains a non-ASCII byte. Rule D-9."); break; }
    }
    if (!MIME_RE.test(mime)) problems.push("Content type " + JSON.stringify(mime) + " does not match the restricted-name grammar. Lowercase type/subtype, no parameters. Rules D-8 and D-10.");

    if (hash.length !== 32) problems.push("Body hash field is " + hash.length + " bytes; it must be exactly 32. Rule D-12.");
    if (body.length < 1 || body.length > 256) problems.push("Body is " + body.length + " bytes; the range is 1 to 256. Rule D-14.");
    if (key.length !== 32) problems.push("Creator key is " + key.length + " bytes; it must be exactly 32. Rule D-18.");
    else if (!isXOnlyPoint(key)) problems.push("Creator key is 32 bytes but is not a point on the secp256k1 curve. Rule D-19.");

    return sha256(body).then(function (digest) {
      var digestHex = toHex(digest);
      var hashHex = toHex(hash);
      var hashOk = hash.length === 32 && digestHex === hashHex;
      if (hash.length === 32 && !hashOk) {
        problems.push("The body hash field does not equal SHA-256 of the body. Declared " + hashHex + ", computed " + digestHex + ". Rule D-13.");
      }

      var html = "";
      if (problems.length) {
        html += verdict("bad", problems.length === 1 ? "One rule failed" : problems.length + " rules failed");
        html += "<ul>";
        problems.forEach(function (p) { html += "<li>" + esc(p) + "</li>"; });
        html += "</ul>";
      } else {
        html += verdict("ok", "Valid Drops leaf, structurally and cryptographically consistent");
      }

      if (offset > 0) {
        html += '<p class="fnote">Found a Drops leaf at byte offset ' + offset + " inside " + total + " bytes of input. The leaf itself is " + leaf.length + " bytes.</p>";
      }

      html += '<ul class="field-list">';
      html += row("marker", marker, MARKERS[marker]
        ? "Namespace: a " + MARKERS[marker] + ". Consumed by OP_DROP."
        : "Not owned by Drops.");
      html += row("content type", mime, "Declared media type of the body. The protocol keeps no allowlist; the <a href=\"artifact.html#serving\">serving policy</a> is what decides inline rendering.");
      html += row("body hash", hashHex, hashOk
        ? "Matches SHA-256 of the body below."
        : "Declared value. " + (hash.length === 32 ? "Does not match the body." : "Wrong length."));
      html += row("body length", body.length + " bytes", "Limit is 256. Push opcode used: 0x" + pushes[3].op.toString(16).padStart(2, "0") + ".");

      var text = utf8(body);
      var ctrl = new RegExp("[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]");
      if (text !== null && !ctrl.test(text)) {
        html += row("body as text", text, "Decoded as UTF-8 for display only. The protocol treats the body as opaque bytes.");
      }
      html += row("body as hex", toHex(body), "The exact bytes that were committed.");
      html += row("creator key", toHex(key), "x-only secp256k1 key checked by OP_CHECKSIG. A claim by the spender, not an attestation of authorship.");
      html += "</ul>";

      /* Pact body profiles */
      if (marker === "drops-pact" || mime === "application/vnd.drops.pact-seed") {
        var seed = decodeSeed(body);
        html += "<h3>Pact Seed record</h3>";
        if (seed.error) {
          html += verdict("bad", "Body does not decode as a Pact Seed") + '<p class="fnote">' + esc(seed.error) + "</p>";
        } else {
          html += '<ul class="field-list">';
          html += row("network", seed.network, "Tag byte at offset 5.");
          html += row("enforcementFloor", seed.enforcementFloor, "How much of this agreement Bitcoin enforces on its own. See <a href=\"pacts.html#floors\">enforcement floors</a>.");
          html += row("engineId", seed.engineId, "Which rule engine interprets the ruleset.");
          html += row("rulesetHash", seed.rulesetHash, "The agreement's rules. Part of the pact identity.");
          html += row("abiHash", seed.abiHash, "The shape of the actions the ruleset accepts. Part of the pact identity.");
          html += row("genesisStateRoot", seed.genesisStateRoot, "Opening state, before any transition.");
          html += row("policyRoot", seed.policyRoot, "Policy in force at genesis. Part of the pact identity.");
          html += row("dataAvailabilityPolicyHash", seed.dataAvailabilityPolicyHash, "Where the parties agreed the off-chain material lives.");
          html += "</ul>";
          html += '<p class="fnote">The pact identity is a tagged hash over the network tag, this Seed\'s own Drop identity, the ruleset hash, the ABI hash and the policy root. It cannot be computed from the body alone, because it needs the reveal transaction id and input index.</p>';
        }
      } else if (mime === "application/vnd.drops.pacts-reference+json") {
        var ref = decodeReference(body);
        html += "<h3>Pacts reference</h3>";
        if (ref.error) {
          html += verdict("bad", "Body does not decode as a Pacts reference") + '<p class="fnote">' + esc(ref.error) + "</p>";
        } else {
          html += '<ul class="field-list">';
          html += row("template", ref.template, "The agreement template these hashes belong to.");
          html += row("planHash", ref.planHash, "SHA-256 of the plan the parties kept.");
          html += row("blueprintHash", ref.blueprintHash, "SHA-256 of the blueprint the parties kept.");
          html += "</ul>";
          html += '<p class="fnote">Neither hash reveals anything on its own. They let a party show that the document they hold is the document this Drop committed to.</p>';
        }
      }

      html += '<h3>What this tool did not check</h3><ul>' +
        "<li>The Taproot commitment. That needs the spent output script and the control block from the reveal witness, which are not part of the leaf.</li>" +
        "<li>Whether the reveal transaction is confirmed, or confirmed deeply enough for an indexer to record it.</li>" +
        "<li>Anything about ownership, authorship or custody.</li></ul>";

      out.innerHTML = html;
    });
  }

  /* ---- wiring --------------------------------------------------------- */

  var input = document.getElementById("decoder-input");
  var form = document.getElementById("decoder-form");
  if (!input || !form || !out) return;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var raw = input.value.trim();
    if (!raw) { out.innerHTML = ""; return; }
    var bytes = hexToBytes(raw);
    if (!bytes || !bytes.length) {
      fail("Input is not hexadecimal, or has an odd number of characters. Paste the leaf script hex, or the full reveal transaction hex and this tool will look inside it.");
      return;
    }
    var direct = parseLeaf(bytes);
    if (direct.ok) { render(direct, 0, bytes.length); return; }
    var found = findLeaf(bytes);
    /* A leaf starting at offset 0 but not filling the input is a leaf with
       trailing bytes, which rule D-1 rejects. Only treat a leaf as embedded
       when something genuinely precedes it, such as a whole transaction. */
    if (found && found.offset === 0) found = null;
    if (found) {
      var parsed = parseLeaf(found.bytes);
      if (parsed.ok) { render(parsed, found.offset, bytes.length); return; }
    }
    fail(direct.error + (bytes.length > 200 ? " No Drops leaf was found anywhere else in the input either." : ""));
  });

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("[data-sample]");
    if (!btn) return;
    ev.preventDefault();
    input.value = btn.getAttribute("data-sample");
    form.dispatchEvent(new Event("submit"));
    out.scrollIntoView({ block: "nearest" });
  });
})();
