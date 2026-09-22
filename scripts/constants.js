export const MR_LUE = Object.freeze({
  ID: "mr-la-ultima-emision",
  SOCKET: "module.mr-la-ultima-emision",
  CONTROLLER_FLAG: "controller",
  CONTROL_JOURNAL: "MR-La Última Emisión · Control",
  WINDOW_PREFIX: "mr-la-ultima-emision.window.",
  TAB_PREFIX: "mr-la-ultima-emision.tab.",
  MACRO_FOLDER: "MR-La Última Emisión",
});

export const DEFAULT_PUBLIC_STATE = Object.freeze({
  schemaVersion: 1,
  onAir: true,
  stationName: "MR Radio",
  programName: "La Última Emisión",
  headline: "La frecuencia está abierta.",
  statusLine: "En espera de llamadas",
  signal: 5,
  signalMax: 6,
  activeCall: null,
  interference: null,
  overlay: {
    visible: true,
    locked: true,
    x: 0.68,
    y: 0.08,
    width: 430
  },
  revision: 0
});

export const DEFAULT_PRIVATE_STATE = Object.freeze({
  calls: [],
  privateNote: "",
  processedRequests: []
});
