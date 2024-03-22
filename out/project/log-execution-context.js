/*
Created by Franz Zemen 03/22/2024
License Type: MIT
*/
// Where are log levels determined?
export var LogLevelManagement;
(function (LogLevelManagement) {
    LogLevelManagement["Adapter"] = "Adapter";
    LogLevelManagement["Native"] = "Native";
    LogLevelManagement["Independent"] = "Independent"; // Default, log level is driven independently, first by adapter, than by native.  Most restrictive wins.
})(LogLevelManagement || (LogLevelManagement = {}));
export var AttributesFormatOption;
(function (AttributesFormatOption) {
    AttributesFormatOption["Stringify"] = "Stringify";
    AttributesFormatOption["Inspect"] = "Inspect";
    AttributesFormatOption["Augment"] = "Augment";
})(AttributesFormatOption || (AttributesFormatOption = {}));
export var DataFormatOption;
(function (DataFormatOption) {
    DataFormatOption["Inspect"] = "Inspect";
    DataFormatOption["Default"] = "Default";
})(DataFormatOption || (DataFormatOption = {}));
export var MessageFormatOption;
(function (MessageFormatOption) {
    MessageFormatOption["Default"] = "Default";
    MessageFormatOption["Augment"] = "Augment";
})(MessageFormatOption || (MessageFormatOption = {}));
//# sourceMappingURL=log-execution-context.js.map