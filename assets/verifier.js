/* Drop Pact outcome verifier. Runs entirely in your browser.
   Nothing you paste is transmitted, stored or logged. There is no network
   call in this file and no persistence of input. */
(function () {
  "use strict";

  var NETWORKS = ["mainnet", "testnet", "signet", "regtest"];

  function hexToBytes(hex) {
    var clean = String(hex).replace(/^0x/i, "").replace(/[\s:,]/g, "");
    if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 || !clean.length) return null;
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
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  function concat(list) {
    var total = 0, i;
    for (i = 0; i < list.length; i++) total += list[i].length;
    var out = new Uint8Array(total), at = 0;
    for (i = 0; i < list.length; i++) { out.set(list[i], at); at += list[i].length; }
    return out;
  }

  function sha256(bytes) {
    return crypto.subtle.digest("SHA-256", bytes).then(function (b) { return new Uint8Array(b); });
  }

  /* BIP 340 tagged hash: SHA256(SHA256(tag) || SHA256(tag) || message) */
  function taggedHash(tag, message) {
    return sha256(new TextEncoder().encode(tag)).then(function (t) {
      return sha256(concat([t, t, message]));
    });
  }

  function readU64(bytes, at) {
    var v = 0n;
    for (var i = 0; i < 8; i++) v = (v << 8n) | BigInt(bytes[at + i]);
    return v;
  }

  function readU32(bytes, at) {
    return ((bytes[at] << 24) >>> 0) + (bytes[at + 1] << 16) + (bytes[at + 2] << 8) + bytes[at + 3];
  }

  /* ---- decoders ------------------------------------------------------- */

  function decodeCell(bytes, label) {
    if (bytes.length !== 176) throw new Error(label + " must be exactly 176 bytes; got " + bytes.length + ". Error PACTS_INVALID_CELL_LENGTH.");
    if (ascii(bytes.subarray(0, 4)) !== "DPCL") throw new Error(label + " magic is not DPCL. Error PACTS_INVALID_CELL_MAGIC.");
    if (bytes[4] !== 0 || bytes[6] !== 0 || bytes[7] !== 0) throw new Error(label + " reserved bytes at offsets 4, 6 and 7 must all be zero. Error PACTS_INVALID_CELL_RESERVED.");
    return {
      flags: bytes[5],
      pactId: toHex(bytes.subarray(8, 40)),
      sequence: readU64(bytes, 40),
      stateRoot: toHex(bytes.subarray(48, 80)),
      policyRoot: toHex(bytes.subarray(80, 112)),
      stateAttachmentHash: toHex(bytes.subarray(112, 144)),
      transitionCommitment: toHex(bytes.subarray(144, 176))
    };
  }

  function decodeTransition(bytes) {
    if (bytes.length !== 245) throw new Error("The transition preimage must be exactly 245 bytes; got " + bytes.length + ". Error PACTS_INVALID_TRANSITION_LENGTH.");
    var net = NETWORKS[bytes[0]];
    if (!net) throw new Error("Unknown network tag " + bytes[0] + " at offset 0.");
    var txid = Array.prototype.slice.call(bytes.subarray(33, 65)).reverse();
    return {
      network: net,
      pactId: toHex(bytes.subarray(1, 33)),
      parentTxid: toHex(new Uint8Array(txid)),
      parentVout: readU32(bytes, 65),
      parentInputIndex: readU32(bytes, 69),
      successorOutputIndex: readU32(bytes, 73),
      parentSequence: readU64(bytes, 77),
      parentStateRoot: toHex(bytes.subarray(85, 117)),
      nextStateRoot: toHex(bytes.subarray(117, 149)),
      nextPolicyRoot: toHex(bytes.subarray(149, 181)),
      proofPackHash: toHex(bytes.subarray(181, 213)),
      opDropEffectHash: toHex(bytes.subarray(213, 245))
    };
  }

  function decodeDpc1(bytes) {
    if (bytes.length !== 38) throw new Error("A DPC1 anchor script is exactly 38 bytes; got " + bytes.length + ".");
    if (bytes[0] !== 0x6a || bytes[1] !== 0x24) throw new Error("A DPC1 anchor must start with OP_RETURN and a 36-byte push (6a 24).");
    if (ascii(bytes.subarray(2, 6)) !== "DPC1") throw new Error("Anchor tag is not DPC1.");
    return toHex(bytes.subarray(6, 38));
  }

  /* ---- rendering ------------------------------------------------------ */

  var out = document.getElementById("verifier-result");

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function checkRow(rule, title, pass, detail) {
    return '<li><span class="fname">' + rule + " " + (pass ? "pass" : "fail") + '</span>' +
      '<span class="fval">' + esc(title) + "</span>" +
      '<span class="fnote">' + esc(detail) + "</span></li>";
  }

  var form = document.getElementById("verifier-form");
  if (!form || !out) return;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    var raw = {
      parent: document.getElementById("v-parent").value.trim(),
      successor: document.getElementById("v-successor").value.trim(),
      transition: document.getElementById("v-transition").value.trim(),
      anchor: document.getElementById("v-anchor").value.trim()
    };

    if (!raw.parent || !raw.successor || !raw.transition) {
      out.innerHTML = '<p class="result__verdict is-warn">The parent cell, successor cell and transition preimage are all required.</p>';
      return;
    }

    var parentBytes = hexToBytes(raw.parent);
    var successorBytes = hexToBytes(raw.successor);
    var transitionBytes = hexToBytes(raw.transition);
    var anchorBytes = raw.anchor ? hexToBytes(raw.anchor) : null;

    var parent, successor, transition, anchor = null;
    try {
      if (!parentBytes) throw new Error("The parent cell descriptor is not valid hexadecimal.");
      if (!successorBytes) throw new Error("The successor cell descriptor is not valid hexadecimal.");
      if (!transitionBytes) throw new Error("The transition preimage is not valid hexadecimal.");
      if (raw.anchor && !anchorBytes) throw new Error("The DPC1 anchor script is not valid hexadecimal.");
      parent = decodeCell(parentBytes, "The parent cell descriptor");
      successor = decodeCell(successorBytes, "The successor cell descriptor");
      transition = decodeTransition(transitionBytes);
      if (anchorBytes) anchor = decodeDpc1(anchorBytes);
    } catch (err) {
      out.innerHTML = '<p class="result__verdict is-bad">Input did not decode</p><p class="fnote">' + esc(err.message) + "</p>";
      return;
    }

    taggedHash("Drops/PactTransition", transitionBytes).then(function (digest) {
      var commitment = toHex(digest);
      var checks = [];

      var idsMatch = parent.pactId === transition.pactId && successor.pactId === transition.pactId;
      checks.push({
        rule: "P-1", pass: idsMatch, title: "All three records name the same Pact",
        detail: idsMatch
          ? "Pact id " + transition.pactId
          : "Parent " + parent.pactId + ", successor " + successor.pactId + ", transition " + transition.pactId + ". PACTS_INVALID_TRANSITION: Pact IDs do not match."
      });

      var seqMatch = parent.sequence === transition.parentSequence && successor.sequence === parent.sequence + 1n;
      checks.push({
        rule: "P-2", pass: seqMatch, title: "Sequence advances by exactly one",
        detail: seqMatch
          ? "Parent sequence " + parent.sequence + ", successor sequence " + successor.sequence + "."
          : "Parent " + parent.sequence + ", transition parentSequence " + transition.parentSequence + ", successor " + successor.sequence + ". PACTS_INVALID_TRANSITION: cell sequence is invalid."
      });

      var rootProblems = [];
      if (parent.stateRoot !== transition.parentStateRoot) rootProblems.push("parent state root");
      if (successor.stateRoot !== transition.nextStateRoot) rootProblems.push("successor state root");
      if (successor.policyRoot !== transition.nextPolicyRoot) rootProblems.push("successor policy root");
      checks.push({
        rule: "P-3", pass: rootProblems.length === 0, title: "Recorded roots match the stated terms",
        detail: rootProblems.length === 0
          ? "The state the Pact left, the state it reached, and the policy now in force all agree with the transition."
          : "Mismatched: " + rootProblems.join(", ") + ". PACTS_INVALID_TRANSITION: cell roots do not match the transition."
      });

      var commitMatch = successor.transitionCommitment === commitment;
      checks.push({
        rule: "P-7", pass: commitMatch, title: "Successor commits to this exact transition",
        detail: commitMatch
          ? "taggedHash(\"Drops/PactTransition\", preimage) = " + commitment
          : "Computed " + commitment + ", successor carries " + successor.transitionCommitment + ". PACTS_INVALID_TRANSITION: successor descriptor does not commit to the transition."
      });

      if (anchor !== null) {
        var anchorMatch = anchor === commitment;
        checks.push({
          rule: "P-9", pass: anchorMatch, title: "DPC1 anchor carries the same commitment",
          detail: anchorMatch
            ? "The on-chain anchor and the successor cell agree."
            : "Anchor carries " + anchor + ", the transition commits to " + commitment + ". PACTS_INVALID_DPC1: DPC1 commitment does not match the proof pack transition."
        });
      }

      var failed = checks.filter(function (c) { return !c.pass; });
      var html = "";
      if (failed.length === 0) {
        html += '<p class="result__verdict is-ok">Outcome matches its stated terms across ' + checks.length + " checks</p>";
      } else {
        html += '<p class="result__verdict is-bad">' + failed.length + " of " + checks.length + " checks failed</p>";
      }

      html += '<ul class="field-list">';
      checks.forEach(function (c) { html += checkRow(c.rule, c.title, c.pass, c.detail); });
      html += "</ul>";

      html += "<h3>What the records say</h3>";
      html += '<ul class="field-list">';
      html += '<li><span class="fname">network</span><span class="fval">' + esc(transition.network) + "</span></li>";
      html += '<li><span class="fname">pactId</span><span class="fval">' + esc(transition.pactId) + "</span></li>";
      html += '<li><span class="fname">moves</span><span class="fval">sequence ' + parent.sequence + " to " + successor.sequence + "</span></li>";
      html += '<li><span class="fname">parent outpoint</span><span class="fval">' + esc(transition.parentTxid) + ":" + transition.parentVout +
        '</span><span class="fnote">Spent at input index ' + transition.parentInputIndex + ", successor written to output index " + transition.successorOutputIndex + ".</span></li>";
      html += '<li><span class="fname">state</span><span class="fval">' + esc(transition.parentStateRoot) + "<br>to " + esc(transition.nextStateRoot) + "</span></li>";
      html += '<li><span class="fname">policy</span><span class="fval">' + esc(transition.nextPolicyRoot) + "</span></li>";
      html += '<li><span class="fname">proofPackHash</span><span class="fval">' + esc(transition.proofPackHash) + "</span></li>";
      html += '<li><span class="fname">opDropEffectHash</span><span class="fval">' + esc(transition.opDropEffectHash) +
        '</span><span class="fnote">' + (/^0{64}$/.test(transition.opDropEffectHash)
          ? "All zero, so this transition carries no OP_DROP token effect."
          : "Non-zero, so this transition claims an OP_DROP token effect whose payload must hash to this value.") + "</span></li>";
      html += "</ul>";

      html += "<h3>What this tool did not check</h3><ul>";
      html += "<li><strong>P-4, P-5 and P-6.</strong> The ruleset result, the OP_DROP effect payload and the proof pack payload hash. These need the deterministic CBOR proof pack, which is not part of the on-chain records above.</li>";
      html += "<li><strong>P-8.</strong> The successor cell's own Taproot commitment. That needs the control block and the successor output script, plus secp256k1 point arithmetic.</li>";
      html += "<li>Whether any of these transactions are confirmed, or whether the Pact exists on chain at all.</li>";
      html += "</ul>";
      html += '<p class="fnote">A pass here means the recorded outcome is internally consistent with the terms it claims to follow. It is not a statement that the agreement was performed. Read the <a href="pacts.html#floors">enforcement floor</a> to know what Bitcoin itself guarantees for this Pact.</p>';

      out.innerHTML = html;
    });
  });

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("[data-fill]");
    if (!btn) return;
    ev.preventDefault();
    var data;
    try { data = JSON.parse(btn.getAttribute("data-fill")); } catch (e) { return; }
    Object.keys(data).forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.value = data[k];
    });
    form.dispatchEvent(new Event("submit"));
    out.scrollIntoView({ block: "nearest" });
  });
})();
