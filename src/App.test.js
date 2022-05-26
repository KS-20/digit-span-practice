globalThis.IS_REACT_ACT_ENVIRONMENT = true; //see:  https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment

import React from "react";
import { act } from "react-dom/test-utils";
import pretty from "pretty";
import ReactDOM from 'react-dom/client';


import App from './App';
import {appEngine} from './source.js'

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

test("Snapshot of initial page", () => {
  act(() => {
    root = ReactDOM.createRoot(container);
    root.render(<App appEngine={appEngine}/>);  

  });

  expect(pretty(container.innerHTML)).toMatchSnapshot(); 
});