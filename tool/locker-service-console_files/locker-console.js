/**
 * Copyright (C) 2017 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Bundle from locker-console
 * Generated: 2018-10-04
 * Version: 0.4.15
 */

(function () {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  const EM_DASH = '\u2014';

  function setGrid(html = '') {
    const output = $('#grid-output');
    output.innerHTML = html;
  }

  function format(result) {
    return result || EM_DASH;
  }

  function showGrid(results) {
    const template = $('#grid-template');
    const text = template.textContent;

    const compiled = window._.template(text, { imports: { f: format } });
    const html = compiled({ rows: results });

    setGrid(html);
  }

  function unsafeEval(code) {
    if (!code) {
      return code;
    }
    try {
      return window.eval(code);
    } catch (e) {
      return e;
    }
  }

  const key = { namespace: 'ns' };

  function safeEval(code) {
    if (!code) {
      return code;
    }
    try {
      return window.Locker.evaluate(code, key);
    } catch (e) {
      return e;
    }
  }

  function speed(bench) {
    if (bench.hz > 0) {
      return `${bench.hz.toFixed(1)} ops/s ±${bench.stats.rme.toFixed(1)}%`;
    }
    if (bench.aborted) {
      return bench.error && bench.error.stack;
    }
    return '';
  }

  function fastest(actual, base) {
    if (actual.hz > 0 && base.hz > 0) {
      let name;
      let ratio;
      if (actual.hz > base.hz) {
        name = actual.name;
        ratio = actual.hz / base.hz;
      } else {
        name = base.name;
        ratio = base.hz / actual.hz;
      }
      return `${name} ${ratio.toFixed(2)} x`;
    }
    return '';
  }

  const { _ } = window;
  const benchmark = window.Benchmark.runInContext({ _: _, document: false });

  function format$1(result) {
    // Special cases
    if (result === '') {
      return `''`;
    }
    if (Array.isArray(result)) {
      return `[${result}]`;
    }
    if (_.isPlainObject(result)) {
      return JSON.stringify(result);
    }
    return String(result);
  }

  function evaluate(code, results, lockerEnabled) {
    const unsafe = lockerEnabled ? undefined : format$1(unsafeEval(code));
    const safe = lockerEnabled ? format$1(safeEval(code)) : undefined;

    const row = { code, unsafe, safe };

    results.push(row);
  }

  function bench(code, results, update, done) {
    const row = {
      code: code,
      unsafe: '(waiting)',
      safe: '(waiting)',
      fastest: '(waiting)'
    };

    results.push(row);

    new benchmark.Suite()
      .add('Locker Off', () => unsafeEval(code))
      .add('Locker On', () => safeEval(code))
      .on('start', () => update())
      .on('cycle', event => {
        const current = event.currentTarget;
        row.unsafe = speed(current[0]) || row.unsafe;
        row.safe = speed(current[1]) || row.safe;
        update();
      })
      .on('complete', event => {
        const current = event.currentTarget;
        row.fastest = fastest(current[0], current[1]);
        update();
        done();
      })
      .run({
        maxTime: 5,
        async: true
      });
  }

  const sourceCode = $('#source-code');

  const editor = window.CodeMirror.fromTextArea(sourceCode, {
    lineNumbers: true,
    autoCloseBrackets: true,
    mode: 'javascript',
    matchBrackets: true,
    extraKeys: { 'Ctrl-Space': 'autocomplete' },
    lineWrapping: true
  });

  const getCode = () => editor.getValue();

  const evaluateBtn = $('#btn-evaluate');
  const benchBtn = $('#btn-benchmark');
  const clearBtn = $('#btn-clear');
  const cspInput = $('#input-csp');
  const output = $('#grid-output');
  const lockerInput = $('#input-locker');

  let results = [];

  function disable(flag) {
    const controls = $$('input, button');
    for (const el of controls) {
      el.disabled = flag;
    }
  }

  // The status checkbox is hidden on page load to prevent flashing in the UI.
  // We first read the get parameters, set the values on the checkboxes, then unhide them.
  const url = new URL(window.location);
  let isStrictCSP = !(url.searchParams.get('csp') === 'off');
  let isLockerEnabled = !(url.searchParams.get('locker') === 'off');

  cspInput.checked = isStrictCSP;
  lockerInput.checked = isLockerEnabled;

  $('#controls').classList.remove('slds-hide');

  if (isStrictCSP) {
    document.head.insertAdjacentHTML(
      'beforeend',
      `<meta http-equiv="Content-Security-Policy" content="script-src 'unsafe-eval' https: http:;">`
    );
  }

  window.Locker.init({
    isFrozen: isStrictCSP,
    unsafeGlobal: window,
    unsafeEval: window.eval,
    unsafeFunction: window.Function
  });

  evaluateBtn.onclick = () => {
    disable(true);
    const code = getCode();
    evaluate(code, results, isLockerEnabled);
    showGrid(results);
    disable(false);
  };

  benchBtn.onclick = () => {
    disable(true);
    const code = getCode();
    bench(
      code,
      results,
      () => {
        showGrid(results);
      },
      () => {
        disable(false);
      }
    );
  };

  clearBtn.onclick = () => {
    output.innerHTML = '';
    results = [];
  };

  cspInput.onclick = () => {
    isStrictCSP = !isStrictCSP;
    url.searchParams.set('csp', isStrictCSP ? 'on' : 'off');
    window.location = url;
  };

  lockerInput.onclick = () => {
    isLockerEnabled = !isLockerEnabled;
    url.searchParams.set('locker', isLockerEnabled ? 'on' : 'off');
    window.history.pushState({}, '', url);
  };

  document.onclick = function(event) {
    const target = $('#information-icon');
    const popover = $('#information-popover');
    if (
      event.target.parentNode.parentNode === target ||
      event.target.parentNode === target ||
      event.target === target
    ) {
      popover.classList.toggle('slds-hidden');
      return;
    }
    popover.classList.add('slds-hidden');
  };

}());
