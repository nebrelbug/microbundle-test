export function getAsyncFunctionConstructor(): Function {
  return async function () {}.constructor
}
