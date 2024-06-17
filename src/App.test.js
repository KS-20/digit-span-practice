globalThis.IS_REACT_ACT_ENVIRONMENT = true; //see:  https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment

import 'whatwg-fetch'
import React from "react";
import { act } from "react";
import pretty from "pretty";
import ReactDOM from 'react-dom/client';

import { appEngine } from './source.js'
import { jest } from '@jest/globals'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.unstable_mockModule('react-apexcharts', () => {
  return {
    __esModule: true,
    default: () => {
      return ""    
    },

  }
})

const ReactApexChart = await import('react-apexcharts');
const App = (await import('./App')).default;



let container = null;
let root = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  // unmountComponentAtNode(container);
  // root.unmount();
  container.remove();
  container = null;
});

test("Snapshot of initial page",async () => {
  jest.useFakeTimers();
  await act(async () => {
    root = ReactDOM.createRoot(container);
    root.render(<App appEngine={appEngine} />);
    await jest.runAllTimersAsync();
  });

  expect(pretty(container.innerHTML)).toMatchSnapshot();
});