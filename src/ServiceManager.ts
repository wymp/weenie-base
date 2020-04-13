import { ServiceManagerConfig } from "./Types";

export const serviceManagement = (r: { config: ServiceManagerConfig }) => {
  // t is our timeout, extRes is an externalization of the "resolve" function for the timeout promise
  let t: any;
  let extRes: any;

  // Promisify the job wait timeout
  const initTimeout = new Promise((res, rej) => {
    // Set the externalized resolver
    extRes = res;

    // Set the timeout
    t = setTimeout(() => {
      rej(
        new Error(
          `INITIALIZATION FAILED: Service took longer than configured ${Math.round(
            r.config.initializationTimeoutMs / 10
          ) /
            100} seconds to initialize and is therefore considered failed. Make sure you call the ` +
            `\`initialized()\` function on the resulting dependency container to mark that the ` +
            `process has successfully initialized.`
        )
      );
    }, r.config.initializationTimeoutMs);
  });

  // Now return the new dependency, 'svc'
  return {
    svc: {
      // Allows dependents to await the initialization timeout
      initTimeout,

      // If called with no arguments, returns the current initialization state. If called with
      // 'true', clears the init timeout and resolves the initialization timeout promise
      initialized: (isInitialized?: true) => {
        if (typeof isInitialized === "undefined") {
          return t === null;
        } else {
          if (t) {
            clearTimeout(t);
            t = null;
            extRes();
          }
          return true;
        }
      },
    },
  };
};
