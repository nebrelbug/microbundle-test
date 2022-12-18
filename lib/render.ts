import compile from "./compile.js"
import { getConfig } from "./config.js"

/* TYPES */

import type { EtaConfig, PartialConfig } from "./config.js"
import type { TemplateFunction } from "./compile.js"
import type { CallbackFn } from "./file-handlers.js"

/* END TYPES */

function handleCache(
  template: string | TemplateFunction,
  options: EtaConfig
): TemplateFunction {
  if (options.cache && options.name && options.templates.get(options.name)) {
    return options.templates.get(options.name)
  }

  const templateFunc =
    typeof template === "function" ? template : compile(template, options)

  // Note that we don't have to check if it already exists in the cache;
  // it would have returned earlier if it had
  if (options.cache && options.name) {
    options.templates.define(options.name, templateFunc)
  }

  return templateFunc
}

/**
 * Render a template
 *
 * If `template` is a string, Eta will compile it to a function and then call it with the provided data.
 * If `template` is a template function, Eta will call it with the provided data.
 *
 * If `config.async` is `false`, Eta will return the rendered template.
 *
 * If `config.async` is `true` and there's a callback function, Eta will call the callback with `(err, renderedTemplate)`.
 * If `config.async` is `true` and there's not a callback function, Eta will return a Promise that resolves to the rendered template.
 *
 * If `config.cache` is `true` and `config` has a `name` or `filename` property, Eta will cache the template on the first render and use the cached template for all subsequent renders.
 *
 * @param template Template string or template function
 * @param data Data to render the template with
 * @param config Optional config options
 * @param cb Callback function
 */

export default function render(
  template: string | TemplateFunction,
  data: object,
  config?: PartialConfig,
  cb?: CallbackFn
): string | Promise<string> | void {
  const options = getConfig(config || {})

  if (options.async) {
    if (cb) {
      // If user passes callback
      try {
        // Note: if there is an error while rendering the template,
        // It will bubble up and be caught here
        const templateFn = handleCache(template, options)
        templateFn(data, options, cb)
      } catch (err) {
        return cb(err as Error)
      }
    } else {
      return new Promise(function (resolve: Function, reject: Function) {
        try {
          resolve(handleCache(template, options)(data, options))
        } catch (err) {
          reject(err)
        }
      })
    }
  } else {
    return handleCache(template, options)(data, options)
  }
}

/**
 * Render a template asynchronously
 *
 * If `template` is a string, Eta will compile it to a function and call it with the provided data.
 * If `template` is a function, Eta will call it with the provided data.
 *
 * If there is a callback function, Eta will call it with `(err, renderedTemplate)`.
 * If there is not a callback function, Eta will return a Promise that resolves to the rendered template
 *
 * @param template Template string or template function
 * @param data Data to render the template with
 * @param config Optional config options
 * @param cb Callback function
 */

export function renderAsync(
  template: string | TemplateFunction,
  data: object,
  config?: PartialConfig,
  cb?: CallbackFn
): string | Promise<string> | void {
  // Using Object.assign to lower bundle size, using spread operator makes it larger because of typescript injected polyfills
  return render(template, data, Object.assign({}, config, { async: true }), cb)
}
