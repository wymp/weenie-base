import * as rt from "runtypes";

/**
 * CONFIG STRUCTURE DEFINITIONS
 *
 * The following definitions are more convenience than mandate. All frameworks work by establishing
 * certain conventions and enforcing certain assumptions. Since this is a micro-framework, it
 * doesn't go so far as to "enforce" the conventions laid out here. However, following them is
 * expected to bring lots of benefit and very little cost.
 */

/**
 * A webservice should specify one or more listening ports with optional hosts (may be the same
 * port on multiple hosts)
 */
const Port = rt.Number;
const Host = rt.String;
export const webServiceConfigValidator = rt.Record({
  listeners: rt.Array(rt.Tuple(Port, optional(Host))),
});
export type WebServiceConfig = rt.Static<typeof webServiceConfigValidator>;

/**
 * This config provides a very basic model for API access, where a given API requires an API key
 * and secret and has a base URL that is configurable per-environment.
 */
export const apiConfigValidator = rt.Record({
  key: rt.String,
  secret: rt.String,
  baseUrl: rt.String,
});
export type ApiConfig = rt.Static<typeof apiConfigValidator>;

/**
 * This is mostly just a runtime validation of AMQP configs
 */
export const mqConnectionConfigValidator = rt.Record({
  protocol: rt.Literal("amqp"),
  hostname: rt.String,
  port: rt.Number,
  username: rt.String,
  password: rt.String,
  locale: rt.String,
  vhost: rt.String,
  heartbeat: rt.Number,
});
export type MQConnectionConfig = rt.Static<typeof mqConnectionConfigValidator>;

/**
 * Mostly just a runtime validation of MySQL configs
 */
export const databaseConfigValidator = rt.Record({
  host: rt.Union(rt.String, rt.Undefined),
  port: rt.Union(rt.Number, rt.Undefined),
  socketPath: rt.Union(rt.String, rt.Undefined),
  user: rt.String,
  password: rt.String,
  database: rt.String,
});
export type DatabaseConfig = rt.Static<typeof databaseConfigValidator>;

/**
 * Defines a logfile path and a level at which to write logs
 */
export const loggerConfigValidator = rt.Record({
  logLevel: rt
    .Literal("debug")
    .Or(rt.Literal("info"))
    .Or(rt.Literal("notice"))
    .Or(rt.Literal("warning"))
    .Or(rt.Literal("error"))
    .Or(rt.Literal("alert"))
    .Or(rt.Literal("critical"))
    .Or(rt.Literal("emergency")),

  // If this is null, then logs are only written to stdout
  logFilePath: rt.String.Or(rt.Null),
});
export type LoggerConfig = rt.Static<typeof loggerConfigValidator>;

/**
 * Define a configuration that is aware of its environment
 */
const environmentAwareConfigValidator = rt.Record({
  /** Defines an environment type, e.g., 'dev', 'uat', 'qa', 'staging', 'prod' */
  envType: rt.String,

  /** Defines a specific environment name, e.g., 'dev', 'demo1', 'demo2', 'staging', 'prod' */
  envName: rt.String,
});

/**
 * A configuration that specifies parameters for a job manager
 */
const jobManagerConfigValidator = rt.Record({
  /**
   * This is the intitial time in ms that we should wait before retrying a failed job.
   *
   * This is intended to be used by an exponential backoff system, where the system takes this
   * parameter and doubles it on each failed attempt.
   */
  initialJobWaitMs: optional(rt.Number),

  /** Maximum time to wait in ms before the application should stop retrying a failed job */
  maxJobWaitMs: optional(rt.Number),
});

/**
 * Config for a module that manages a running service
 */
const serviceManagerConfigValidator = rt.Record({
  /** Maximum time to wait in ms for the application to start before we should throw an error */
  initializationTimeoutMs: rt.Number,
});

/**
 * Brings all the config validators together into a cohesive collection
 *
 * The framework config is a combination of environment-aware config, job manager config and
 * service manager config with the addition of specific subgroups for logging, amqp, db, and
 * webservice config.
 */
export const baseConfigValidator = rt.Intersect(
  environmentAwareConfigValidator,
  jobManagerConfigValidator,
  serviceManagerConfigValidator,
  rt.Record({
    /** The service name */
    serviceName: rt.String,

    /** Logger configuration */
    logger: loggerConfigValidator,
  })
);
export type BaseConfig = rt.Static<typeof baseConfigValidator>;

/**
 * MESSAGES
 */
export interface MQEventHandler<Resources> {
  name: string;
  bindings: Array<string>;
  handler: (ev: unknown, resources: Resources) => Promise<boolean>;
}

/**
 * CRON
 */

/**
 * The following define a "Clockspec". This follows the format laid out in
 * http://man7.org/linux/man-pages/man5/crontab.5.html, with the addition of the 'seconds'
 * field at the beginning.
 */
type Second = string;
type Minute = string;
type Hour = string;
type DayOfMonth = string;
type Month = string;
type DayOfWeek = string;
export type Clockspec = [Second, Minute, Hour, DayOfMonth, Month, DayOfWeek];

/**
 * Defines an interval-based cronjob. This will run every time the given interval(s) are met.
 */
export interface IntervalCronjob<Resources> {
  name: string;
  type: "interval";
  intervalMS: number | Array<number>;
  handler: (r: Resources) => Promise<boolean>;
}
export interface ClockCronjob<Resources> {
  name: string;
  type: "clock";
  clockspec: Clockspec | Array<Clockspec>;
  handler: (r: Resources) => Promise<boolean>;
}
export type Cronjob<Resources> = IntervalCronjob<Resources> | ClockCronjob<Resources>;

/**
 * MISCELLANEOUS
 *
 * Miscellaneous utilities to make our code cleaner
 */

// Make arguments optional
function optional<T extends rt.Runtype>(t: T) {
  return rt.Union(t, rt.Undefined);
}
