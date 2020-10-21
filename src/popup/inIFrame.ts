import { createApp } from 'vue';
import IFrameApp from './IFrameApp.vue';

const getIframeSrc = (window: Window) => {
  return window.frameElement ? window.frameElement.getAttribute('src') : window.location.href;
};

export const init = async (): Promise<void> => {
  if (document.getElementById('plussubShadow')) return;
  const videoEl = document.querySelector('video');
  if (!videoEl || !videoEl.offsetHeight || !videoEl.offsetWidth || !videoEl.src || !videoEl.currentSrc) return;

  const frameSrc = getIframeSrc(window.parent !== window.top ? window.parent : window);
  const appShadowDiv = document.createElement('div');
  const shadow = appShadowDiv.attachShadow({ mode: 'open' });
  appShadowDiv.id = 'plussubShadow';
  const appDiv = document.createElement('div');
  appDiv.id = 'plussub';
  shadow.appendChild(appDiv);
  const app = createApp(IFrameApp, {
    frameSrc,
    videoEl
  });
  app.mount(appDiv);
};
