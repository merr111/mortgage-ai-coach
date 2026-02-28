import '@angular/compiler';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const resolveResource = (url: string): Promise<Response> => {
  return fetch(new URL(url, import.meta.url).href);
};

resolveComponentResources(resolveResource)
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
