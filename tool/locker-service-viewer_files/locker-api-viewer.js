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
 * Bundle from locker-api-viewer
 * Generated: 2018-10-23
 * Version: 0.4.15
 */

(function () {
  'use strict';

  window.Locker.init({
    unsafeGlobal: window,
    unsafeEval: window.eval,
    unsafeFunction: window.Function
  });

  const key = { namespace: 'ns' };
  const secureWindow = window.Locker.getEnv(key);

  function sortReport(report) {
    report.protos = report.protos.sort((a, b) => (a.proto < b.proto ? -1 : 1));
  }

  const propNameRegex = /\[object (.+)\]/;

  function getType(prop) {
    const name = Object.prototype.toString.call(prop);
    const results = propNameRegex.exec(name);
    return results && results.length > 1 ? results[1] : name;
  }

  function testObject(object, secureObject, report) {
    if (report === undefined) report = { protos: [] };
    const protos = report.protos;

    const baseObject = object;
    for (; object !== null; object = Reflect.getPrototypeOf(object)) {
      const proto = getType(object);

      let props = null;
      for (let i = 0; i < protos.length; i++) {
        if (protos[i].proto === proto) props = protos[i].props;
      }

      if (!props) {
        props = [];
        protos.push({ proto, props });
      }

      Object.getOwnPropertyNames(object)
        .sort()
        .forEach(prop => {
          if (prop === 'top' || prop === 'parent') {
            return;
          }
          for (let i = 0; i < props.length; i++) {
            if (props[i].prop === prop) {
              return;
            }
          }
          const systemProp = baseObject[prop];
          const secureProp = secureObject[prop];
          const systemType = getType(systemProp);
          const secureType = getType(secureProp);

          const status =
            systemProp === secureProp || (Number.isNaN(systemProp) && Number.isNaN(secureProp))
              ? 'pass'
              : secureType === 'Undefined' ? 'fail' : 'warning';
          props.push({
            prop,
            systemType,
            secureType,
            status
          });
        });
    }
    return report;
  }

  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  const closest = (el, selector) => {
    for (; el && el !== document; el = el.parentNode) {
      if (el.matches(selector)) {
        return el;
      }
    }
    return null;
  };

  const template = $('#report-template');
  const text = template.textContent;
  const compiled = window._.template(text);

  function renderReport(report, systemApi, secureApi) {
    return compiled({ report, systemApi, secureApi });
  }

  function testWindow() {
    const report = testObject(window, secureWindow);
    sortReport(report);
    return renderReport(report, 'Window', 'SecureWindow');
  }

  function testDocument() {
    const report = testObject(document, secureWindow.document);
    sortReport(report);
    return renderReport(report, 'Document', 'SecureDocument');
  }

  const tagNames = [
    'A',
    'AREA',
    'AUDIO',
    'BASE',
    'BDO',
    'BUTTON',
    'CANVAS',
    'CAPTION',
    'COL',
    'COLGROUP',
    'DATA',
    'DEL',
    'DETAILS',
    'EMBED',
    'FIELDSET',
    'FORM',
    'IFRAME',
    'IMG',
    'INPUT',
    'INS',
    'LABEL',
    'LI',
    'LINK',
    'MAP',
    'META',
    'METER',
    'OBJECT',
    'OL',
    'OPTGROUP',
    'OPTION',
    'OUTPUT',
    'PARAM',
    'PROGRESS',
    'Q',
    'SELECT',
    'SLOT',
    'SOURCE',
    'TABLE',
    'TBODY',
    'TD',
    'TFOOT',
    'TEMPLATE',
    'TEXTAREA',
    'TH',
    'THEAD',
    'TIME',
    'TR',
    'TRACK',
    'VIDEO',

    'SVG'
  ];

  function testElement() {
    const secureDocument = secureWindow.document;

    const report = testObject(document.createTextNode(''), secureDocument.createTextNode(''));

    tagNames.forEach(tagName => {
      testObject(document.createElement(tagName), secureDocument.createElement(tagName), report);
    });

    sortReport(report);
    return renderReport(report, 'Element', 'SecureElement');
  }

  const tabset = $('main > ul');
  const tabs = $$('main > ul > li');
  const panels = $$('main > div');

  tabset.onclick = event => {
    const target = closest(event.target, 'li');
    tabs.forEach((tab, index) => {
      const selected = tab === target;
      tab.classList.toggle('slds-is-active', selected);
      panels[index].classList.toggle('slds-show', selected);
      panels[index].classList.toggle('slds-hide', !selected);
    });
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

  // Cleanup global pollution
  delete window._;
  delete window.DOMPurify;
  delete window.Locker;

  panels[0].innerHTML = testWindow();
  panels[1].innerHTML = testDocument();
  panels[2].innerHTML = testElement();

}());
