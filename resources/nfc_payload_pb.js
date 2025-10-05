/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.medis = (function() {

    /**
     * Namespace medis.
     * @exports medis
     * @namespace
     */
    var medis = {};

    medis.nfc = (function() {

        /**
         * Namespace nfc.
         * @memberof medis
         * @namespace
         */
        var nfc = {};

        /**
         * SystemType enum.
         * @name medis.nfc.SystemType
         * @enum {number}
         * @property {number} UNKNOWN_SYSTEM=0 UNKNOWN_SYSTEM value
         * @property {number} SNOMED_CT=1 SNOMED_CT value
         * @property {number} LOINC=2 LOINC value
         * @property {number} UCUM=3 UCUM value
         * @property {number} HL7_CONDITION=4 HL7_CONDITION value
         * @property {number} HL7_VERIFICATION=5 HL7_VERIFICATION value
         * @property {number} HL7_OBSERVATION=6 HL7_OBSERVATION value
         * @property {number} ISO_3166=7 ISO_3166 value
         * @property {number} NHS_IDENTIFIER=8 NHS_IDENTIFIER value
         */
        nfc.SystemType = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "UNKNOWN_SYSTEM"] = 0;
            values[valuesById[1] = "SNOMED_CT"] = 1;
            values[valuesById[2] = "LOINC"] = 2;
            values[valuesById[3] = "UCUM"] = 3;
            values[valuesById[4] = "HL7_CONDITION"] = 4;
            values[valuesById[5] = "HL7_VERIFICATION"] = 5;
            values[valuesById[6] = "HL7_OBSERVATION"] = 6;
            values[valuesById[7] = "ISO_3166"] = 7;
            values[valuesById[8] = "NHS_IDENTIFIER"] = 8;
            return values;
        })();

        /**
         * ClinicalStatus enum.
         * @name medis.nfc.ClinicalStatus
         * @enum {number}
         * @property {number} UNKNOWN_CLINICAL=0 UNKNOWN_CLINICAL value
         * @property {number} ACTIVE=1 ACTIVE value
         * @property {number} RESOLVED=2 RESOLVED value
         * @property {number} INACTIVE=3 INACTIVE value
         * @property {number} REMISSION=4 REMISSION value
         */
        nfc.ClinicalStatus = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "UNKNOWN_CLINICAL"] = 0;
            values[valuesById[1] = "ACTIVE"] = 1;
            values[valuesById[2] = "RESOLVED"] = 2;
            values[valuesById[3] = "INACTIVE"] = 3;
            values[valuesById[4] = "REMISSION"] = 4;
            return values;
        })();

        /**
         * VerificationStatus enum.
         * @name medis.nfc.VerificationStatus
         * @enum {number}
         * @property {number} UNKNOWN_VERIFICATION=0 UNKNOWN_VERIFICATION value
         * @property {number} CONFIRMED=1 CONFIRMED value
         * @property {number} UNCONFIRMED=2 UNCONFIRMED value
         * @property {number} PROVISIONAL=3 PROVISIONAL value
         * @property {number} DIFFERENTIAL=4 DIFFERENTIAL value
         */
        nfc.VerificationStatus = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "UNKNOWN_VERIFICATION"] = 0;
            values[valuesById[1] = "CONFIRMED"] = 1;
            values[valuesById[2] = "UNCONFIRMED"] = 2;
            values[valuesById[3] = "PROVISIONAL"] = 3;
            values[valuesById[4] = "DIFFERENTIAL"] = 4;
            return values;
        })();

        /**
         * ObservationCategory enum.
         * @name medis.nfc.ObservationCategory
         * @enum {number}
         * @property {number} UNKNOWN_CATEGORY=0 UNKNOWN_CATEGORY value
         * @property {number} VITAL_SIGNS=1 VITAL_SIGNS value
         * @property {number} LABORATORY=2 LABORATORY value
         * @property {number} SURVEY=3 SURVEY value
         * @property {number} SOCIAL_HISTORY=4 SOCIAL_HISTORY value
         */
        nfc.ObservationCategory = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "UNKNOWN_CATEGORY"] = 0;
            values[valuesById[1] = "VITAL_SIGNS"] = 1;
            values[valuesById[2] = "LABORATORY"] = 2;
            values[valuesById[3] = "SURVEY"] = 3;
            values[valuesById[4] = "SOCIAL_HISTORY"] = 4;
            return values;
        })();

        nfc.CodeRef = (function() {

            /**
             * Properties of a CodeRef.
             * @memberof medis.nfc
             * @interface ICodeRef
             * @property {string|null} [sys] CodeRef sys
             * @property {medis.nfc.SystemType|null} [systemId] CodeRef systemId
             * @property {string|null} [code] CodeRef code
             * @property {medis.nfc.ClinicalStatus|null} [clinicalStatus] CodeRef clinicalStatus
             * @property {medis.nfc.VerificationStatus|null} [verificationStatus] CodeRef verificationStatus
             * @property {medis.nfc.ObservationCategory|null} [category] CodeRef category
             */

            /**
             * Constructs a new CodeRef.
             * @memberof medis.nfc
             * @classdesc Represents a CodeRef.
             * @implements ICodeRef
             * @constructor
             * @param {medis.nfc.ICodeRef=} [properties] Properties to set
             */
            function CodeRef(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CodeRef sys.
             * @member {string|null|undefined} sys
             * @memberof medis.nfc.CodeRef
             * @instance
             */
            CodeRef.prototype.sys = null;

            /**
             * CodeRef systemId.
             * @member {medis.nfc.SystemType|null|undefined} systemId
             * @memberof medis.nfc.CodeRef
             * @instance
             */
            CodeRef.prototype.systemId = null;

            /**
             * CodeRef code.
             * @member {string} code
             * @memberof medis.nfc.CodeRef
             * @instance
             */
            CodeRef.prototype.code = "";

            /**
             * CodeRef clinicalStatus.
             * @member {medis.nfc.ClinicalStatus} clinicalStatus
             * @memberof medis.nfc.CodeRef
             * @instance
             */
            CodeRef.prototype.clinicalStatus = 0;

            /**
             * CodeRef verificationStatus.
             * @member {medis.nfc.VerificationStatus} verificationStatus
             * @memberof medis.nfc.CodeRef
             * @instance
             */
            CodeRef.prototype.verificationStatus = 0;

            /**
             * CodeRef category.
             * @member {medis.nfc.ObservationCategory} category
             * @memberof medis.nfc.CodeRef
             * @instance
             */
            CodeRef.prototype.category = 0;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * CodeRef systemReference.
             * @member {"sys"|"systemId"|undefined} systemReference
             * @memberof medis.nfc.CodeRef
             * @instance
             */
            Object.defineProperty(CodeRef.prototype, "systemReference", {
                get: $util.oneOfGetter($oneOfFields = ["sys", "systemId"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new CodeRef instance using the specified properties.
             * @function create
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {medis.nfc.ICodeRef=} [properties] Properties to set
             * @returns {medis.nfc.CodeRef} CodeRef instance
             */
            CodeRef.create = function create(properties) {
                return new CodeRef(properties);
            };

            /**
             * Encodes the specified CodeRef message. Does not implicitly {@link medis.nfc.CodeRef.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {medis.nfc.ICodeRef} message CodeRef message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CodeRef.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.sys != null && Object.hasOwnProperty.call(message, "sys"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.sys);
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.code);
                if (message.systemId != null && Object.hasOwnProperty.call(message, "systemId"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int32(message.systemId);
                if (message.clinicalStatus != null && Object.hasOwnProperty.call(message, "clinicalStatus"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int32(message.clinicalStatus);
                if (message.verificationStatus != null && Object.hasOwnProperty.call(message, "verificationStatus"))
                    writer.uint32(/* id 11, wireType 0 =*/88).int32(message.verificationStatus);
                if (message.category != null && Object.hasOwnProperty.call(message, "category"))
                    writer.uint32(/* id 12, wireType 0 =*/96).int32(message.category);
                return writer;
            };

            /**
             * Encodes the specified CodeRef message, length delimited. Does not implicitly {@link medis.nfc.CodeRef.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {medis.nfc.ICodeRef} message CodeRef message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CodeRef.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CodeRef message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.CodeRef} CodeRef
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CodeRef.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.CodeRef();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.sys = reader.string();
                            break;
                        }
                    case 9: {
                            message.systemId = reader.int32();
                            break;
                        }
                    case 2: {
                            message.code = reader.string();
                            break;
                        }
                    case 10: {
                            message.clinicalStatus = reader.int32();
                            break;
                        }
                    case 11: {
                            message.verificationStatus = reader.int32();
                            break;
                        }
                    case 12: {
                            message.category = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CodeRef message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.CodeRef} CodeRef
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CodeRef.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CodeRef message.
             * @function verify
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CodeRef.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.sys != null && message.hasOwnProperty("sys")) {
                    properties.systemReference = 1;
                    if (!$util.isString(message.sys))
                        return "sys: string expected";
                }
                if (message.systemId != null && message.hasOwnProperty("systemId")) {
                    if (properties.systemReference === 1)
                        return "systemReference: multiple values";
                    properties.systemReference = 1;
                    switch (message.systemId) {
                    default:
                        return "systemId: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        break;
                    }
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    if (!$util.isString(message.code))
                        return "code: string expected";
                if (message.clinicalStatus != null && message.hasOwnProperty("clinicalStatus"))
                    switch (message.clinicalStatus) {
                    default:
                        return "clinicalStatus: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.verificationStatus != null && message.hasOwnProperty("verificationStatus"))
                    switch (message.verificationStatus) {
                    default:
                        return "verificationStatus: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.category != null && message.hasOwnProperty("category"))
                    switch (message.category) {
                    default:
                        return "category: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                return null;
            };

            /**
             * Creates a CodeRef message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.CodeRef} CodeRef
             */
            CodeRef.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.CodeRef)
                    return object;
                var message = new $root.medis.nfc.CodeRef();
                if (object.sys != null)
                    message.sys = String(object.sys);
                switch (object.systemId) {
                default:
                    if (typeof object.systemId === "number") {
                        message.systemId = object.systemId;
                        break;
                    }
                    break;
                case "UNKNOWN_SYSTEM":
                case 0:
                    message.systemId = 0;
                    break;
                case "SNOMED_CT":
                case 1:
                    message.systemId = 1;
                    break;
                case "LOINC":
                case 2:
                    message.systemId = 2;
                    break;
                case "UCUM":
                case 3:
                    message.systemId = 3;
                    break;
                case "HL7_CONDITION":
                case 4:
                    message.systemId = 4;
                    break;
                case "HL7_VERIFICATION":
                case 5:
                    message.systemId = 5;
                    break;
                case "HL7_OBSERVATION":
                case 6:
                    message.systemId = 6;
                    break;
                case "ISO_3166":
                case 7:
                    message.systemId = 7;
                    break;
                case "NHS_IDENTIFIER":
                case 8:
                    message.systemId = 8;
                    break;
                }
                if (object.code != null)
                    message.code = String(object.code);
                switch (object.clinicalStatus) {
                default:
                    if (typeof object.clinicalStatus === "number") {
                        message.clinicalStatus = object.clinicalStatus;
                        break;
                    }
                    break;
                case "UNKNOWN_CLINICAL":
                case 0:
                    message.clinicalStatus = 0;
                    break;
                case "ACTIVE":
                case 1:
                    message.clinicalStatus = 1;
                    break;
                case "RESOLVED":
                case 2:
                    message.clinicalStatus = 2;
                    break;
                case "INACTIVE":
                case 3:
                    message.clinicalStatus = 3;
                    break;
                case "REMISSION":
                case 4:
                    message.clinicalStatus = 4;
                    break;
                }
                switch (object.verificationStatus) {
                default:
                    if (typeof object.verificationStatus === "number") {
                        message.verificationStatus = object.verificationStatus;
                        break;
                    }
                    break;
                case "UNKNOWN_VERIFICATION":
                case 0:
                    message.verificationStatus = 0;
                    break;
                case "CONFIRMED":
                case 1:
                    message.verificationStatus = 1;
                    break;
                case "UNCONFIRMED":
                case 2:
                    message.verificationStatus = 2;
                    break;
                case "PROVISIONAL":
                case 3:
                    message.verificationStatus = 3;
                    break;
                case "DIFFERENTIAL":
                case 4:
                    message.verificationStatus = 4;
                    break;
                }
                switch (object.category) {
                default:
                    if (typeof object.category === "number") {
                        message.category = object.category;
                        break;
                    }
                    break;
                case "UNKNOWN_CATEGORY":
                case 0:
                    message.category = 0;
                    break;
                case "VITAL_SIGNS":
                case 1:
                    message.category = 1;
                    break;
                case "LABORATORY":
                case 2:
                    message.category = 2;
                    break;
                case "SURVEY":
                case 3:
                    message.category = 3;
                    break;
                case "SOCIAL_HISTORY":
                case 4:
                    message.category = 4;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a CodeRef message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {medis.nfc.CodeRef} message CodeRef
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CodeRef.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = "";
                    object.clinicalStatus = options.enums === String ? "UNKNOWN_CLINICAL" : 0;
                    object.verificationStatus = options.enums === String ? "UNKNOWN_VERIFICATION" : 0;
                    object.category = options.enums === String ? "UNKNOWN_CATEGORY" : 0;
                }
                if (message.sys != null && message.hasOwnProperty("sys")) {
                    object.sys = message.sys;
                    if (options.oneofs)
                        object.systemReference = "sys";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = message.code;
                if (message.systemId != null && message.hasOwnProperty("systemId")) {
                    object.systemId = options.enums === String ? $root.medis.nfc.SystemType[message.systemId] === undefined ? message.systemId : $root.medis.nfc.SystemType[message.systemId] : message.systemId;
                    if (options.oneofs)
                        object.systemReference = "systemId";
                }
                if (message.clinicalStatus != null && message.hasOwnProperty("clinicalStatus"))
                    object.clinicalStatus = options.enums === String ? $root.medis.nfc.ClinicalStatus[message.clinicalStatus] === undefined ? message.clinicalStatus : $root.medis.nfc.ClinicalStatus[message.clinicalStatus] : message.clinicalStatus;
                if (message.verificationStatus != null && message.hasOwnProperty("verificationStatus"))
                    object.verificationStatus = options.enums === String ? $root.medis.nfc.VerificationStatus[message.verificationStatus] === undefined ? message.verificationStatus : $root.medis.nfc.VerificationStatus[message.verificationStatus] : message.verificationStatus;
                if (message.category != null && message.hasOwnProperty("category"))
                    object.category = options.enums === String ? $root.medis.nfc.ObservationCategory[message.category] === undefined ? message.category : $root.medis.nfc.ObservationCategory[message.category] : message.category;
                return object;
            };

            /**
             * Converts this CodeRef to JSON.
             * @function toJSON
             * @memberof medis.nfc.CodeRef
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CodeRef.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for CodeRef
             * @function getTypeUrl
             * @memberof medis.nfc.CodeRef
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            CodeRef.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.CodeRef";
            };

            return CodeRef;
        })();

        nfc.Patient = (function() {

            /**
             * Properties of a Patient.
             * @memberof medis.nfc
             * @interface IPatient
             * @property {string|null} [given] Patient given
             * @property {string|null} [family] Patient family
             * @property {medis.nfc.ICodeRef|null} [gender] Patient gender
             * @property {medis.nfc.ICodeRef|null} [bloodGroup] Patient bloodGroup
             * @property {medis.nfc.ICodeRef|null} [nhsId] Patient nhsId
             * @property {medis.nfc.ICodeRef|null} [serviceId] Patient serviceId
             * @property {string|null} [dob] Patient dob
             * @property {medis.nfc.ICodeRef|null} [rank] Patient rank
             * @property {string|null} [title] Patient title
             * @property {medis.nfc.ICodeRef|null} [nationality] Patient nationality
             * @property {string|null} [id] Patient id
             */

            /**
             * Constructs a new Patient.
             * @memberof medis.nfc
             * @classdesc Represents a Patient.
             * @implements IPatient
             * @constructor
             * @param {medis.nfc.IPatient=} [properties] Properties to set
             */
            function Patient(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Patient given.
             * @member {string} given
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.given = "";

            /**
             * Patient family.
             * @member {string} family
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.family = "";

            /**
             * Patient gender.
             * @member {medis.nfc.ICodeRef|null|undefined} gender
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.gender = null;

            /**
             * Patient bloodGroup.
             * @member {medis.nfc.ICodeRef|null|undefined} bloodGroup
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.bloodGroup = null;

            /**
             * Patient nhsId.
             * @member {medis.nfc.ICodeRef|null|undefined} nhsId
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.nhsId = null;

            /**
             * Patient serviceId.
             * @member {medis.nfc.ICodeRef|null|undefined} serviceId
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.serviceId = null;

            /**
             * Patient dob.
             * @member {string} dob
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.dob = "";

            /**
             * Patient rank.
             * @member {medis.nfc.ICodeRef|null|undefined} rank
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.rank = null;

            /**
             * Patient title.
             * @member {string} title
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.title = "";

            /**
             * Patient nationality.
             * @member {medis.nfc.ICodeRef|null|undefined} nationality
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.nationality = null;

            /**
             * Patient id.
             * @member {string} id
             * @memberof medis.nfc.Patient
             * @instance
             */
            Patient.prototype.id = "";

            /**
             * Creates a new Patient instance using the specified properties.
             * @function create
             * @memberof medis.nfc.Patient
             * @static
             * @param {medis.nfc.IPatient=} [properties] Properties to set
             * @returns {medis.nfc.Patient} Patient instance
             */
            Patient.create = function create(properties) {
                return new Patient(properties);
            };

            /**
             * Encodes the specified Patient message. Does not implicitly {@link medis.nfc.Patient.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.Patient
             * @static
             * @param {medis.nfc.IPatient} message Patient message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Patient.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.given != null && Object.hasOwnProperty.call(message, "given"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.given);
                if (message.family != null && Object.hasOwnProperty.call(message, "family"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.family);
                if (message.gender != null && Object.hasOwnProperty.call(message, "gender"))
                    $root.medis.nfc.CodeRef.encode(message.gender, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.bloodGroup != null && Object.hasOwnProperty.call(message, "bloodGroup"))
                    $root.medis.nfc.CodeRef.encode(message.bloodGroup, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.nhsId != null && Object.hasOwnProperty.call(message, "nhsId"))
                    $root.medis.nfc.CodeRef.encode(message.nhsId, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.serviceId != null && Object.hasOwnProperty.call(message, "serviceId"))
                    $root.medis.nfc.CodeRef.encode(message.serviceId, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.dob != null && Object.hasOwnProperty.call(message, "dob"))
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.dob);
                if (message.rank != null && Object.hasOwnProperty.call(message, "rank"))
                    $root.medis.nfc.CodeRef.encode(message.rank, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.title != null && Object.hasOwnProperty.call(message, "title"))
                    writer.uint32(/* id 9, wireType 2 =*/74).string(message.title);
                if (message.nationality != null && Object.hasOwnProperty.call(message, "nationality"))
                    $root.medis.nfc.CodeRef.encode(message.nationality, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 11, wireType 2 =*/90).string(message.id);
                return writer;
            };

            /**
             * Encodes the specified Patient message, length delimited. Does not implicitly {@link medis.nfc.Patient.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.Patient
             * @static
             * @param {medis.nfc.IPatient} message Patient message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Patient.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Patient message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.Patient
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.Patient} Patient
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Patient.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.Patient();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.given = reader.string();
                            break;
                        }
                    case 2: {
                            message.family = reader.string();
                            break;
                        }
                    case 3: {
                            message.gender = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.bloodGroup = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 5: {
                            message.nhsId = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            message.serviceId = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 7: {
                            message.dob = reader.string();
                            break;
                        }
                    case 8: {
                            message.rank = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 9: {
                            message.title = reader.string();
                            break;
                        }
                    case 10: {
                            message.nationality = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 11: {
                            message.id = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Patient message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.Patient
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.Patient} Patient
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Patient.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Patient message.
             * @function verify
             * @memberof medis.nfc.Patient
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Patient.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.given != null && message.hasOwnProperty("given"))
                    if (!$util.isString(message.given))
                        return "given: string expected";
                if (message.family != null && message.hasOwnProperty("family"))
                    if (!$util.isString(message.family))
                        return "family: string expected";
                if (message.gender != null && message.hasOwnProperty("gender")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.gender);
                    if (error)
                        return "gender." + error;
                }
                if (message.bloodGroup != null && message.hasOwnProperty("bloodGroup")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.bloodGroup);
                    if (error)
                        return "bloodGroup." + error;
                }
                if (message.nhsId != null && message.hasOwnProperty("nhsId")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.nhsId);
                    if (error)
                        return "nhsId." + error;
                }
                if (message.serviceId != null && message.hasOwnProperty("serviceId")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.serviceId);
                    if (error)
                        return "serviceId." + error;
                }
                if (message.dob != null && message.hasOwnProperty("dob"))
                    if (!$util.isString(message.dob))
                        return "dob: string expected";
                if (message.rank != null && message.hasOwnProperty("rank")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.rank);
                    if (error)
                        return "rank." + error;
                }
                if (message.title != null && message.hasOwnProperty("title"))
                    if (!$util.isString(message.title))
                        return "title: string expected";
                if (message.nationality != null && message.hasOwnProperty("nationality")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.nationality);
                    if (error)
                        return "nationality." + error;
                }
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                return null;
            };

            /**
             * Creates a Patient message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.Patient
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.Patient} Patient
             */
            Patient.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.Patient)
                    return object;
                var message = new $root.medis.nfc.Patient();
                if (object.given != null)
                    message.given = String(object.given);
                if (object.family != null)
                    message.family = String(object.family);
                if (object.gender != null) {
                    if (typeof object.gender !== "object")
                        throw TypeError(".medis.nfc.Patient.gender: object expected");
                    message.gender = $root.medis.nfc.CodeRef.fromObject(object.gender);
                }
                if (object.bloodGroup != null) {
                    if (typeof object.bloodGroup !== "object")
                        throw TypeError(".medis.nfc.Patient.bloodGroup: object expected");
                    message.bloodGroup = $root.medis.nfc.CodeRef.fromObject(object.bloodGroup);
                }
                if (object.nhsId != null) {
                    if (typeof object.nhsId !== "object")
                        throw TypeError(".medis.nfc.Patient.nhsId: object expected");
                    message.nhsId = $root.medis.nfc.CodeRef.fromObject(object.nhsId);
                }
                if (object.serviceId != null) {
                    if (typeof object.serviceId !== "object")
                        throw TypeError(".medis.nfc.Patient.serviceId: object expected");
                    message.serviceId = $root.medis.nfc.CodeRef.fromObject(object.serviceId);
                }
                if (object.dob != null)
                    message.dob = String(object.dob);
                if (object.rank != null) {
                    if (typeof object.rank !== "object")
                        throw TypeError(".medis.nfc.Patient.rank: object expected");
                    message.rank = $root.medis.nfc.CodeRef.fromObject(object.rank);
                }
                if (object.title != null)
                    message.title = String(object.title);
                if (object.nationality != null) {
                    if (typeof object.nationality !== "object")
                        throw TypeError(".medis.nfc.Patient.nationality: object expected");
                    message.nationality = $root.medis.nfc.CodeRef.fromObject(object.nationality);
                }
                if (object.id != null)
                    message.id = String(object.id);
                return message;
            };

            /**
             * Creates a plain object from a Patient message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.Patient
             * @static
             * @param {medis.nfc.Patient} message Patient
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Patient.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.given = "";
                    object.family = "";
                    object.gender = null;
                    object.bloodGroup = null;
                    object.nhsId = null;
                    object.serviceId = null;
                    object.dob = "";
                    object.rank = null;
                    object.title = "";
                    object.nationality = null;
                    object.id = "";
                }
                if (message.given != null && message.hasOwnProperty("given"))
                    object.given = message.given;
                if (message.family != null && message.hasOwnProperty("family"))
                    object.family = message.family;
                if (message.gender != null && message.hasOwnProperty("gender"))
                    object.gender = $root.medis.nfc.CodeRef.toObject(message.gender, options);
                if (message.bloodGroup != null && message.hasOwnProperty("bloodGroup"))
                    object.bloodGroup = $root.medis.nfc.CodeRef.toObject(message.bloodGroup, options);
                if (message.nhsId != null && message.hasOwnProperty("nhsId"))
                    object.nhsId = $root.medis.nfc.CodeRef.toObject(message.nhsId, options);
                if (message.serviceId != null && message.hasOwnProperty("serviceId"))
                    object.serviceId = $root.medis.nfc.CodeRef.toObject(message.serviceId, options);
                if (message.dob != null && message.hasOwnProperty("dob"))
                    object.dob = message.dob;
                if (message.rank != null && message.hasOwnProperty("rank"))
                    object.rank = $root.medis.nfc.CodeRef.toObject(message.rank, options);
                if (message.title != null && message.hasOwnProperty("title"))
                    object.title = message.title;
                if (message.nationality != null && message.hasOwnProperty("nationality"))
                    object.nationality = $root.medis.nfc.CodeRef.toObject(message.nationality, options);
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                return object;
            };

            /**
             * Converts this Patient to JSON.
             * @function toJSON
             * @memberof medis.nfc.Patient
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Patient.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Patient
             * @function getTypeUrl
             * @memberof medis.nfc.Patient
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Patient.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.Patient";
            };

            return Patient;
        })();

        nfc.Vital = (function() {

            /**
             * Properties of a Vital.
             * @memberof medis.nfc
             * @interface IVital
             * @property {medis.nfc.ICodeRef|null} [code] Vital code
             * @property {number|null} [value] Vital value
             * @property {string|null} [time] Vital time
             * @property {string|null} [id] Vital id
             */

            /**
             * Constructs a new Vital.
             * @memberof medis.nfc
             * @classdesc Represents a Vital.
             * @implements IVital
             * @constructor
             * @param {medis.nfc.IVital=} [properties] Properties to set
             */
            function Vital(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Vital code.
             * @member {medis.nfc.ICodeRef|null|undefined} code
             * @memberof medis.nfc.Vital
             * @instance
             */
            Vital.prototype.code = null;

            /**
             * Vital value.
             * @member {number} value
             * @memberof medis.nfc.Vital
             * @instance
             */
            Vital.prototype.value = 0;

            /**
             * Vital time.
             * @member {string} time
             * @memberof medis.nfc.Vital
             * @instance
             */
            Vital.prototype.time = "";

            /**
             * Vital id.
             * @member {string} id
             * @memberof medis.nfc.Vital
             * @instance
             */
            Vital.prototype.id = "";

            /**
             * Creates a new Vital instance using the specified properties.
             * @function create
             * @memberof medis.nfc.Vital
             * @static
             * @param {medis.nfc.IVital=} [properties] Properties to set
             * @returns {medis.nfc.Vital} Vital instance
             */
            Vital.create = function create(properties) {
                return new Vital(properties);
            };

            /**
             * Encodes the specified Vital message. Does not implicitly {@link medis.nfc.Vital.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.Vital
             * @static
             * @param {medis.nfc.IVital} message Vital message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Vital.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    $root.medis.nfc.CodeRef.encode(message.code, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                    writer.uint32(/* id 2, wireType 1 =*/17).double(message.value);
                if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.time);
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.id);
                return writer;
            };

            /**
             * Encodes the specified Vital message, length delimited. Does not implicitly {@link medis.nfc.Vital.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.Vital
             * @static
             * @param {medis.nfc.IVital} message Vital message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Vital.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Vital message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.Vital
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.Vital} Vital
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Vital.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.Vital();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.code = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.value = reader.double();
                            break;
                        }
                    case 3: {
                            message.time = reader.string();
                            break;
                        }
                    case 4: {
                            message.id = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Vital message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.Vital
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.Vital} Vital
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Vital.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Vital message.
             * @function verify
             * @memberof medis.nfc.Vital
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Vital.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.code);
                    if (error)
                        return "code." + error;
                }
                if (message.value != null && message.hasOwnProperty("value"))
                    if (typeof message.value !== "number")
                        return "value: number expected";
                if (message.time != null && message.hasOwnProperty("time"))
                    if (!$util.isString(message.time))
                        return "time: string expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                return null;
            };

            /**
             * Creates a Vital message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.Vital
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.Vital} Vital
             */
            Vital.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.Vital)
                    return object;
                var message = new $root.medis.nfc.Vital();
                if (object.code != null) {
                    if (typeof object.code !== "object")
                        throw TypeError(".medis.nfc.Vital.code: object expected");
                    message.code = $root.medis.nfc.CodeRef.fromObject(object.code);
                }
                if (object.value != null)
                    message.value = Number(object.value);
                if (object.time != null)
                    message.time = String(object.time);
                if (object.id != null)
                    message.id = String(object.id);
                return message;
            };

            /**
             * Creates a plain object from a Vital message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.Vital
             * @static
             * @param {medis.nfc.Vital} message Vital
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Vital.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = null;
                    object.value = 0;
                    object.time = "";
                    object.id = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = $root.medis.nfc.CodeRef.toObject(message.code, options);
                if (message.value != null && message.hasOwnProperty("value"))
                    object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
                if (message.time != null && message.hasOwnProperty("time"))
                    object.time = message.time;
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                return object;
            };

            /**
             * Converts this Vital to JSON.
             * @function toJSON
             * @memberof medis.nfc.Vital
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Vital.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Vital
             * @function getTypeUrl
             * @memberof medis.nfc.Vital
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Vital.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.Vital";
            };

            return Vital;
        })();

        nfc.Condition = (function() {

            /**
             * Properties of a Condition.
             * @memberof medis.nfc
             * @interface ICondition
             * @property {medis.nfc.ICodeRef|null} [code] Condition code
             * @property {string|null} [onset] Condition onset
             * @property {string|null} [id] Condition id
             */

            /**
             * Constructs a new Condition.
             * @memberof medis.nfc
             * @classdesc Represents a Condition.
             * @implements ICondition
             * @constructor
             * @param {medis.nfc.ICondition=} [properties] Properties to set
             */
            function Condition(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Condition code.
             * @member {medis.nfc.ICodeRef|null|undefined} code
             * @memberof medis.nfc.Condition
             * @instance
             */
            Condition.prototype.code = null;

            /**
             * Condition onset.
             * @member {string} onset
             * @memberof medis.nfc.Condition
             * @instance
             */
            Condition.prototype.onset = "";

            /**
             * Condition id.
             * @member {string} id
             * @memberof medis.nfc.Condition
             * @instance
             */
            Condition.prototype.id = "";

            /**
             * Creates a new Condition instance using the specified properties.
             * @function create
             * @memberof medis.nfc.Condition
             * @static
             * @param {medis.nfc.ICondition=} [properties] Properties to set
             * @returns {medis.nfc.Condition} Condition instance
             */
            Condition.create = function create(properties) {
                return new Condition(properties);
            };

            /**
             * Encodes the specified Condition message. Does not implicitly {@link medis.nfc.Condition.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.Condition
             * @static
             * @param {medis.nfc.ICondition} message Condition message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Condition.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    $root.medis.nfc.CodeRef.encode(message.code, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.onset != null && Object.hasOwnProperty.call(message, "onset"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.onset);
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.id);
                return writer;
            };

            /**
             * Encodes the specified Condition message, length delimited. Does not implicitly {@link medis.nfc.Condition.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.Condition
             * @static
             * @param {medis.nfc.ICondition} message Condition message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Condition.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Condition message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.Condition
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.Condition} Condition
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Condition.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.Condition();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.code = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.onset = reader.string();
                            break;
                        }
                    case 3: {
                            message.id = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Condition message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.Condition
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.Condition} Condition
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Condition.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Condition message.
             * @function verify
             * @memberof medis.nfc.Condition
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Condition.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.code);
                    if (error)
                        return "code." + error;
                }
                if (message.onset != null && message.hasOwnProperty("onset"))
                    if (!$util.isString(message.onset))
                        return "onset: string expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                return null;
            };

            /**
             * Creates a Condition message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.Condition
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.Condition} Condition
             */
            Condition.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.Condition)
                    return object;
                var message = new $root.medis.nfc.Condition();
                if (object.code != null) {
                    if (typeof object.code !== "object")
                        throw TypeError(".medis.nfc.Condition.code: object expected");
                    message.code = $root.medis.nfc.CodeRef.fromObject(object.code);
                }
                if (object.onset != null)
                    message.onset = String(object.onset);
                if (object.id != null)
                    message.id = String(object.id);
                return message;
            };

            /**
             * Creates a plain object from a Condition message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.Condition
             * @static
             * @param {medis.nfc.Condition} message Condition
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Condition.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = null;
                    object.onset = "";
                    object.id = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = $root.medis.nfc.CodeRef.toObject(message.code, options);
                if (message.onset != null && message.hasOwnProperty("onset"))
                    object.onset = message.onset;
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                return object;
            };

            /**
             * Converts this Condition to JSON.
             * @function toJSON
             * @memberof medis.nfc.Condition
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Condition.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Condition
             * @function getTypeUrl
             * @memberof medis.nfc.Condition
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Condition.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.Condition";
            };

            return Condition;
        })();

        nfc.Event = (function() {

            /**
             * Properties of an Event.
             * @memberof medis.nfc
             * @interface IEvent
             * @property {medis.nfc.ICodeRef|null} [code] Event code
             * @property {string|null} [time] Event time
             * @property {number|null} [dose] Event dose
             * @property {string|null} [unit] Event unit
             * @property {string|null} [route] Event route
             * @property {string|null} [id] Event id
             */

            /**
             * Constructs a new Event.
             * @memberof medis.nfc
             * @classdesc Represents an Event.
             * @implements IEvent
             * @constructor
             * @param {medis.nfc.IEvent=} [properties] Properties to set
             */
            function Event(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Event code.
             * @member {medis.nfc.ICodeRef|null|undefined} code
             * @memberof medis.nfc.Event
             * @instance
             */
            Event.prototype.code = null;

            /**
             * Event time.
             * @member {string} time
             * @memberof medis.nfc.Event
             * @instance
             */
            Event.prototype.time = "";

            /**
             * Event dose.
             * @member {number} dose
             * @memberof medis.nfc.Event
             * @instance
             */
            Event.prototype.dose = 0;

            /**
             * Event unit.
             * @member {string} unit
             * @memberof medis.nfc.Event
             * @instance
             */
            Event.prototype.unit = "";

            /**
             * Event route.
             * @member {string} route
             * @memberof medis.nfc.Event
             * @instance
             */
            Event.prototype.route = "";

            /**
             * Event id.
             * @member {string} id
             * @memberof medis.nfc.Event
             * @instance
             */
            Event.prototype.id = "";

            /**
             * Creates a new Event instance using the specified properties.
             * @function create
             * @memberof medis.nfc.Event
             * @static
             * @param {medis.nfc.IEvent=} [properties] Properties to set
             * @returns {medis.nfc.Event} Event instance
             */
            Event.create = function create(properties) {
                return new Event(properties);
            };

            /**
             * Encodes the specified Event message. Does not implicitly {@link medis.nfc.Event.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.Event
             * @static
             * @param {medis.nfc.IEvent} message Event message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Event.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    $root.medis.nfc.CodeRef.encode(message.code, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.time);
                if (message.dose != null && Object.hasOwnProperty.call(message, "dose"))
                    writer.uint32(/* id 3, wireType 1 =*/25).double(message.dose);
                if (message.unit != null && Object.hasOwnProperty.call(message, "unit"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.unit);
                if (message.route != null && Object.hasOwnProperty.call(message, "route"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.route);
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.id);
                return writer;
            };

            /**
             * Encodes the specified Event message, length delimited. Does not implicitly {@link medis.nfc.Event.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.Event
             * @static
             * @param {medis.nfc.IEvent} message Event message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Event.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Event message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.Event
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.Event} Event
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Event.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.Event();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.code = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.time = reader.string();
                            break;
                        }
                    case 3: {
                            message.dose = reader.double();
                            break;
                        }
                    case 4: {
                            message.unit = reader.string();
                            break;
                        }
                    case 5: {
                            message.route = reader.string();
                            break;
                        }
                    case 6: {
                            message.id = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Event message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.Event
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.Event} Event
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Event.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Event message.
             * @function verify
             * @memberof medis.nfc.Event
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Event.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.code);
                    if (error)
                        return "code." + error;
                }
                if (message.time != null && message.hasOwnProperty("time"))
                    if (!$util.isString(message.time))
                        return "time: string expected";
                if (message.dose != null && message.hasOwnProperty("dose"))
                    if (typeof message.dose !== "number")
                        return "dose: number expected";
                if (message.unit != null && message.hasOwnProperty("unit"))
                    if (!$util.isString(message.unit))
                        return "unit: string expected";
                if (message.route != null && message.hasOwnProperty("route"))
                    if (!$util.isString(message.route))
                        return "route: string expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                return null;
            };

            /**
             * Creates an Event message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.Event
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.Event} Event
             */
            Event.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.Event)
                    return object;
                var message = new $root.medis.nfc.Event();
                if (object.code != null) {
                    if (typeof object.code !== "object")
                        throw TypeError(".medis.nfc.Event.code: object expected");
                    message.code = $root.medis.nfc.CodeRef.fromObject(object.code);
                }
                if (object.time != null)
                    message.time = String(object.time);
                if (object.dose != null)
                    message.dose = Number(object.dose);
                if (object.unit != null)
                    message.unit = String(object.unit);
                if (object.route != null)
                    message.route = String(object.route);
                if (object.id != null)
                    message.id = String(object.id);
                return message;
            };

            /**
             * Creates a plain object from an Event message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.Event
             * @static
             * @param {medis.nfc.Event} message Event
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Event.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = null;
                    object.time = "";
                    object.dose = 0;
                    object.unit = "";
                    object.route = "";
                    object.id = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = $root.medis.nfc.CodeRef.toObject(message.code, options);
                if (message.time != null && message.hasOwnProperty("time"))
                    object.time = message.time;
                if (message.dose != null && message.hasOwnProperty("dose"))
                    object.dose = options.json && !isFinite(message.dose) ? String(message.dose) : message.dose;
                if (message.unit != null && message.hasOwnProperty("unit"))
                    object.unit = message.unit;
                if (message.route != null && message.hasOwnProperty("route"))
                    object.route = message.route;
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                return object;
            };

            /**
             * Converts this Event to JSON.
             * @function toJSON
             * @memberof medis.nfc.Event
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Event.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Event
             * @function getTypeUrl
             * @memberof medis.nfc.Event
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Event.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.Event";
            };

            return Event;
        })();

        nfc.Stage = (function() {

            /**
             * Properties of a Stage.
             * @memberof medis.nfc
             * @interface IStage
             * @property {Array.<medis.nfc.IVital>|null} [vitals] Stage vitals
             * @property {Array.<medis.nfc.ICondition>|null} [conditions] Stage conditions
             * @property {Array.<medis.nfc.IEvent>|null} [events] Stage events
             */

            /**
             * Constructs a new Stage.
             * @memberof medis.nfc
             * @classdesc Represents a Stage.
             * @implements IStage
             * @constructor
             * @param {medis.nfc.IStage=} [properties] Properties to set
             */
            function Stage(properties) {
                this.vitals = [];
                this.conditions = [];
                this.events = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Stage vitals.
             * @member {Array.<medis.nfc.IVital>} vitals
             * @memberof medis.nfc.Stage
             * @instance
             */
            Stage.prototype.vitals = $util.emptyArray;

            /**
             * Stage conditions.
             * @member {Array.<medis.nfc.ICondition>} conditions
             * @memberof medis.nfc.Stage
             * @instance
             */
            Stage.prototype.conditions = $util.emptyArray;

            /**
             * Stage events.
             * @member {Array.<medis.nfc.IEvent>} events
             * @memberof medis.nfc.Stage
             * @instance
             */
            Stage.prototype.events = $util.emptyArray;

            /**
             * Creates a new Stage instance using the specified properties.
             * @function create
             * @memberof medis.nfc.Stage
             * @static
             * @param {medis.nfc.IStage=} [properties] Properties to set
             * @returns {medis.nfc.Stage} Stage instance
             */
            Stage.create = function create(properties) {
                return new Stage(properties);
            };

            /**
             * Encodes the specified Stage message. Does not implicitly {@link medis.nfc.Stage.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.Stage
             * @static
             * @param {medis.nfc.IStage} message Stage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Stage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.vitals != null && message.vitals.length)
                    for (var i = 0; i < message.vitals.length; ++i)
                        $root.medis.nfc.Vital.encode(message.vitals[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.conditions != null && message.conditions.length)
                    for (var i = 0; i < message.conditions.length; ++i)
                        $root.medis.nfc.Condition.encode(message.conditions[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.events != null && message.events.length)
                    for (var i = 0; i < message.events.length; ++i)
                        $root.medis.nfc.Event.encode(message.events[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Stage message, length delimited. Does not implicitly {@link medis.nfc.Stage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.Stage
             * @static
             * @param {medis.nfc.IStage} message Stage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Stage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Stage message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.Stage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.Stage} Stage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Stage.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.Stage();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.vitals && message.vitals.length))
                                message.vitals = [];
                            message.vitals.push($root.medis.nfc.Vital.decode(reader, reader.uint32()));
                            break;
                        }
                    case 2: {
                            if (!(message.conditions && message.conditions.length))
                                message.conditions = [];
                            message.conditions.push($root.medis.nfc.Condition.decode(reader, reader.uint32()));
                            break;
                        }
                    case 3: {
                            if (!(message.events && message.events.length))
                                message.events = [];
                            message.events.push($root.medis.nfc.Event.decode(reader, reader.uint32()));
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Stage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.Stage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.Stage} Stage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Stage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Stage message.
             * @function verify
             * @memberof medis.nfc.Stage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Stage.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.vitals != null && message.hasOwnProperty("vitals")) {
                    if (!Array.isArray(message.vitals))
                        return "vitals: array expected";
                    for (var i = 0; i < message.vitals.length; ++i) {
                        var error = $root.medis.nfc.Vital.verify(message.vitals[i]);
                        if (error)
                            return "vitals." + error;
                    }
                }
                if (message.conditions != null && message.hasOwnProperty("conditions")) {
                    if (!Array.isArray(message.conditions))
                        return "conditions: array expected";
                    for (var i = 0; i < message.conditions.length; ++i) {
                        var error = $root.medis.nfc.Condition.verify(message.conditions[i]);
                        if (error)
                            return "conditions." + error;
                    }
                }
                if (message.events != null && message.hasOwnProperty("events")) {
                    if (!Array.isArray(message.events))
                        return "events: array expected";
                    for (var i = 0; i < message.events.length; ++i) {
                        var error = $root.medis.nfc.Event.verify(message.events[i]);
                        if (error)
                            return "events." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a Stage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.Stage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.Stage} Stage
             */
            Stage.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.Stage)
                    return object;
                var message = new $root.medis.nfc.Stage();
                if (object.vitals) {
                    if (!Array.isArray(object.vitals))
                        throw TypeError(".medis.nfc.Stage.vitals: array expected");
                    message.vitals = [];
                    for (var i = 0; i < object.vitals.length; ++i) {
                        if (typeof object.vitals[i] !== "object")
                            throw TypeError(".medis.nfc.Stage.vitals: object expected");
                        message.vitals[i] = $root.medis.nfc.Vital.fromObject(object.vitals[i]);
                    }
                }
                if (object.conditions) {
                    if (!Array.isArray(object.conditions))
                        throw TypeError(".medis.nfc.Stage.conditions: array expected");
                    message.conditions = [];
                    for (var i = 0; i < object.conditions.length; ++i) {
                        if (typeof object.conditions[i] !== "object")
                            throw TypeError(".medis.nfc.Stage.conditions: object expected");
                        message.conditions[i] = $root.medis.nfc.Condition.fromObject(object.conditions[i]);
                    }
                }
                if (object.events) {
                    if (!Array.isArray(object.events))
                        throw TypeError(".medis.nfc.Stage.events: array expected");
                    message.events = [];
                    for (var i = 0; i < object.events.length; ++i) {
                        if (typeof object.events[i] !== "object")
                            throw TypeError(".medis.nfc.Stage.events: object expected");
                        message.events[i] = $root.medis.nfc.Event.fromObject(object.events[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a Stage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.Stage
             * @static
             * @param {medis.nfc.Stage} message Stage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Stage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults) {
                    object.vitals = [];
                    object.conditions = [];
                    object.events = [];
                }
                if (message.vitals && message.vitals.length) {
                    object.vitals = [];
                    for (var j = 0; j < message.vitals.length; ++j)
                        object.vitals[j] = $root.medis.nfc.Vital.toObject(message.vitals[j], options);
                }
                if (message.conditions && message.conditions.length) {
                    object.conditions = [];
                    for (var j = 0; j < message.conditions.length; ++j)
                        object.conditions[j] = $root.medis.nfc.Condition.toObject(message.conditions[j], options);
                }
                if (message.events && message.events.length) {
                    object.events = [];
                    for (var j = 0; j < message.events.length; ++j)
                        object.events[j] = $root.medis.nfc.Event.toObject(message.events[j], options);
                }
                return object;
            };

            /**
             * Converts this Stage to JSON.
             * @function toJSON
             * @memberof medis.nfc.Stage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Stage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Stage
             * @function getTypeUrl
             * @memberof medis.nfc.Stage
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Stage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.Stage";
            };

            return Stage;
        })();

        nfc.BundleMetadata = (function() {

            /**
             * Properties of a BundleMetadata.
             * @memberof medis.nfc
             * @interface IBundleMetadata
             * @property {string|null} [id] BundleMetadata id
             * @property {string|null} [metaJson] BundleMetadata metaJson
             * @property {string|null} [identifierJson] BundleMetadata identifierJson
             * @property {string|null} [type] BundleMetadata type
             * @property {string|null} [timestamp] BundleMetadata timestamp
             */

            /**
             * Constructs a new BundleMetadata.
             * @memberof medis.nfc
             * @classdesc Represents a BundleMetadata.
             * @implements IBundleMetadata
             * @constructor
             * @param {medis.nfc.IBundleMetadata=} [properties] Properties to set
             */
            function BundleMetadata(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * BundleMetadata id.
             * @member {string} id
             * @memberof medis.nfc.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.id = "";

            /**
             * BundleMetadata metaJson.
             * @member {string} metaJson
             * @memberof medis.nfc.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.metaJson = "";

            /**
             * BundleMetadata identifierJson.
             * @member {string} identifierJson
             * @memberof medis.nfc.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.identifierJson = "";

            /**
             * BundleMetadata type.
             * @member {string} type
             * @memberof medis.nfc.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.type = "";

            /**
             * BundleMetadata timestamp.
             * @member {string} timestamp
             * @memberof medis.nfc.BundleMetadata
             * @instance
             */
            BundleMetadata.prototype.timestamp = "";

            /**
             * Creates a new BundleMetadata instance using the specified properties.
             * @function create
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {medis.nfc.IBundleMetadata=} [properties] Properties to set
             * @returns {medis.nfc.BundleMetadata} BundleMetadata instance
             */
            BundleMetadata.create = function create(properties) {
                return new BundleMetadata(properties);
            };

            /**
             * Encodes the specified BundleMetadata message. Does not implicitly {@link medis.nfc.BundleMetadata.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {medis.nfc.IBundleMetadata} message BundleMetadata message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BundleMetadata.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
                if (message.metaJson != null && Object.hasOwnProperty.call(message, "metaJson"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.metaJson);
                if (message.identifierJson != null && Object.hasOwnProperty.call(message, "identifierJson"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.identifierJson);
                if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.type);
                if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.timestamp);
                return writer;
            };

            /**
             * Encodes the specified BundleMetadata message, length delimited. Does not implicitly {@link medis.nfc.BundleMetadata.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {medis.nfc.IBundleMetadata} message BundleMetadata message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BundleMetadata.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a BundleMetadata message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.BundleMetadata} BundleMetadata
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BundleMetadata.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.BundleMetadata();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.id = reader.string();
                            break;
                        }
                    case 2: {
                            message.metaJson = reader.string();
                            break;
                        }
                    case 3: {
                            message.identifierJson = reader.string();
                            break;
                        }
                    case 4: {
                            message.type = reader.string();
                            break;
                        }
                    case 5: {
                            message.timestamp = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a BundleMetadata message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.BundleMetadata} BundleMetadata
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BundleMetadata.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a BundleMetadata message.
             * @function verify
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            BundleMetadata.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                if (message.metaJson != null && message.hasOwnProperty("metaJson"))
                    if (!$util.isString(message.metaJson))
                        return "metaJson: string expected";
                if (message.identifierJson != null && message.hasOwnProperty("identifierJson"))
                    if (!$util.isString(message.identifierJson))
                        return "identifierJson: string expected";
                if (message.type != null && message.hasOwnProperty("type"))
                    if (!$util.isString(message.type))
                        return "type: string expected";
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isString(message.timestamp))
                        return "timestamp: string expected";
                return null;
            };

            /**
             * Creates a BundleMetadata message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.BundleMetadata} BundleMetadata
             */
            BundleMetadata.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.BundleMetadata)
                    return object;
                var message = new $root.medis.nfc.BundleMetadata();
                if (object.id != null)
                    message.id = String(object.id);
                if (object.metaJson != null)
                    message.metaJson = String(object.metaJson);
                if (object.identifierJson != null)
                    message.identifierJson = String(object.identifierJson);
                if (object.type != null)
                    message.type = String(object.type);
                if (object.timestamp != null)
                    message.timestamp = String(object.timestamp);
                return message;
            };

            /**
             * Creates a plain object from a BundleMetadata message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {medis.nfc.BundleMetadata} message BundleMetadata
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BundleMetadata.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.id = "";
                    object.metaJson = "";
                    object.identifierJson = "";
                    object.type = "";
                    object.timestamp = "";
                }
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                if (message.metaJson != null && message.hasOwnProperty("metaJson"))
                    object.metaJson = message.metaJson;
                if (message.identifierJson != null && message.hasOwnProperty("identifierJson"))
                    object.identifierJson = message.identifierJson;
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = message.type;
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    object.timestamp = message.timestamp;
                return object;
            };

            /**
             * Converts this BundleMetadata to JSON.
             * @function toJSON
             * @memberof medis.nfc.BundleMetadata
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BundleMetadata.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for BundleMetadata
             * @function getTypeUrl
             * @memberof medis.nfc.BundleMetadata
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            BundleMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.BundleMetadata";
            };

            return BundleMetadata;
        })();

        nfc.Allergy = (function() {

            /**
             * Properties of an Allergy.
             * @memberof medis.nfc
             * @interface IAllergy
             * @property {medis.nfc.ICodeRef|null} [code] Allergy code
             * @property {string|null} [onset] Allergy onset
             * @property {string|null} [severity] Allergy severity
             * @property {string|null} [id] Allergy id
             * @property {string|null} [recordedDate] Allergy recordedDate
             */

            /**
             * Constructs a new Allergy.
             * @memberof medis.nfc
             * @classdesc Represents an Allergy.
             * @implements IAllergy
             * @constructor
             * @param {medis.nfc.IAllergy=} [properties] Properties to set
             */
            function Allergy(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Allergy code.
             * @member {medis.nfc.ICodeRef|null|undefined} code
             * @memberof medis.nfc.Allergy
             * @instance
             */
            Allergy.prototype.code = null;

            /**
             * Allergy onset.
             * @member {string} onset
             * @memberof medis.nfc.Allergy
             * @instance
             */
            Allergy.prototype.onset = "";

            /**
             * Allergy severity.
             * @member {string} severity
             * @memberof medis.nfc.Allergy
             * @instance
             */
            Allergy.prototype.severity = "";

            /**
             * Allergy id.
             * @member {string} id
             * @memberof medis.nfc.Allergy
             * @instance
             */
            Allergy.prototype.id = "";

            /**
             * Allergy recordedDate.
             * @member {string} recordedDate
             * @memberof medis.nfc.Allergy
             * @instance
             */
            Allergy.prototype.recordedDate = "";

            /**
             * Creates a new Allergy instance using the specified properties.
             * @function create
             * @memberof medis.nfc.Allergy
             * @static
             * @param {medis.nfc.IAllergy=} [properties] Properties to set
             * @returns {medis.nfc.Allergy} Allergy instance
             */
            Allergy.create = function create(properties) {
                return new Allergy(properties);
            };

            /**
             * Encodes the specified Allergy message. Does not implicitly {@link medis.nfc.Allergy.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.Allergy
             * @static
             * @param {medis.nfc.IAllergy} message Allergy message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Allergy.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    $root.medis.nfc.CodeRef.encode(message.code, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.onset != null && Object.hasOwnProperty.call(message, "onset"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.onset);
                if (message.severity != null && Object.hasOwnProperty.call(message, "severity"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.severity);
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.id);
                if (message.recordedDate != null && Object.hasOwnProperty.call(message, "recordedDate"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.recordedDate);
                return writer;
            };

            /**
             * Encodes the specified Allergy message, length delimited. Does not implicitly {@link medis.nfc.Allergy.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.Allergy
             * @static
             * @param {medis.nfc.IAllergy} message Allergy message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Allergy.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Allergy message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.Allergy
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.Allergy} Allergy
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Allergy.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.Allergy();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.code = $root.medis.nfc.CodeRef.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.onset = reader.string();
                            break;
                        }
                    case 3: {
                            message.severity = reader.string();
                            break;
                        }
                    case 4: {
                            message.id = reader.string();
                            break;
                        }
                    case 5: {
                            message.recordedDate = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Allergy message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.Allergy
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.Allergy} Allergy
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Allergy.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Allergy message.
             * @function verify
             * @memberof medis.nfc.Allergy
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Allergy.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code")) {
                    var error = $root.medis.nfc.CodeRef.verify(message.code);
                    if (error)
                        return "code." + error;
                }
                if (message.onset != null && message.hasOwnProperty("onset"))
                    if (!$util.isString(message.onset))
                        return "onset: string expected";
                if (message.severity != null && message.hasOwnProperty("severity"))
                    if (!$util.isString(message.severity))
                        return "severity: string expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                if (message.recordedDate != null && message.hasOwnProperty("recordedDate"))
                    if (!$util.isString(message.recordedDate))
                        return "recordedDate: string expected";
                return null;
            };

            /**
             * Creates an Allergy message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.Allergy
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.Allergy} Allergy
             */
            Allergy.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.Allergy)
                    return object;
                var message = new $root.medis.nfc.Allergy();
                if (object.code != null) {
                    if (typeof object.code !== "object")
                        throw TypeError(".medis.nfc.Allergy.code: object expected");
                    message.code = $root.medis.nfc.CodeRef.fromObject(object.code);
                }
                if (object.onset != null)
                    message.onset = String(object.onset);
                if (object.severity != null)
                    message.severity = String(object.severity);
                if (object.id != null)
                    message.id = String(object.id);
                if (object.recordedDate != null)
                    message.recordedDate = String(object.recordedDate);
                return message;
            };

            /**
             * Creates a plain object from an Allergy message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.Allergy
             * @static
             * @param {medis.nfc.Allergy} message Allergy
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Allergy.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = null;
                    object.onset = "";
                    object.severity = "";
                    object.id = "";
                    object.recordedDate = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = $root.medis.nfc.CodeRef.toObject(message.code, options);
                if (message.onset != null && message.hasOwnProperty("onset"))
                    object.onset = message.onset;
                if (message.severity != null && message.hasOwnProperty("severity"))
                    object.severity = message.severity;
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                if (message.recordedDate != null && message.hasOwnProperty("recordedDate"))
                    object.recordedDate = message.recordedDate;
                return object;
            };

            /**
             * Converts this Allergy to JSON.
             * @function toJSON
             * @memberof medis.nfc.Allergy
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Allergy.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Allergy
             * @function getTypeUrl
             * @memberof medis.nfc.Allergy
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Allergy.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.Allergy";
            };

            return Allergy;
        })();

        nfc.NFCPayload = (function() {

            /**
             * Properties of a NFCPayload.
             * @memberof medis.nfc
             * @interface INFCPayload
             * @property {medis.nfc.IPatient|null} [patient] NFCPayload patient
             * @property {medis.nfc.IStage|null} [poi] NFCPayload poi
             * @property {medis.nfc.IStage|null} [medevac] NFCPayload medevac
             * @property {medis.nfc.IStage|null} [r1] NFCPayload r1
             * @property {medis.nfc.IStage|null} [r2] NFCPayload r2
             * @property {medis.nfc.IStage|null} [casevac] NFCPayload casevac
             * @property {medis.nfc.IStage|null} [r3] NFCPayload r3
             * @property {number|Long|null} [t] NFCPayload t
             * @property {medis.nfc.IBundleMetadata|null} [bundleMetadata] NFCPayload bundleMetadata
             * @property {Array.<medis.nfc.IAllergy>|null} [allergies] NFCPayload allergies
             * @property {string|null} [bundleId] NFCPayload bundleId
             * @property {string|null} [bundleIdentifier] NFCPayload bundleIdentifier
             * @property {string|null} [compositionId] NFCPayload compositionId
             * @property {string|null} [compositionTitle] NFCPayload compositionTitle
             * @property {number|Long|null} [compositionDate] NFCPayload compositionDate
             * @property {string|null} [bundleMetaLastUpdated] NFCPayload bundleMetaLastUpdated
             */

            /**
             * Constructs a new NFCPayload.
             * @memberof medis.nfc
             * @classdesc Represents a NFCPayload.
             * @implements INFCPayload
             * @constructor
             * @param {medis.nfc.INFCPayload=} [properties] Properties to set
             */
            function NFCPayload(properties) {
                this.allergies = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * NFCPayload patient.
             * @member {medis.nfc.IPatient|null|undefined} patient
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.patient = null;

            /**
             * NFCPayload poi.
             * @member {medis.nfc.IStage|null|undefined} poi
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.poi = null;

            /**
             * NFCPayload medevac.
             * @member {medis.nfc.IStage|null|undefined} medevac
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.medevac = null;

            /**
             * NFCPayload r1.
             * @member {medis.nfc.IStage|null|undefined} r1
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.r1 = null;

            /**
             * NFCPayload r2.
             * @member {medis.nfc.IStage|null|undefined} r2
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.r2 = null;

            /**
             * NFCPayload casevac.
             * @member {medis.nfc.IStage|null|undefined} casevac
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.casevac = null;

            /**
             * NFCPayload r3.
             * @member {medis.nfc.IStage|null|undefined} r3
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.r3 = null;

            /**
             * NFCPayload t.
             * @member {number|Long} t
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.t = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * NFCPayload bundleMetadata.
             * @member {medis.nfc.IBundleMetadata|null|undefined} bundleMetadata
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.bundleMetadata = null;

            /**
             * NFCPayload allergies.
             * @member {Array.<medis.nfc.IAllergy>} allergies
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.allergies = $util.emptyArray;

            /**
             * NFCPayload bundleId.
             * @member {string} bundleId
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.bundleId = "";

            /**
             * NFCPayload bundleIdentifier.
             * @member {string} bundleIdentifier
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.bundleIdentifier = "";

            /**
             * NFCPayload compositionId.
             * @member {string} compositionId
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.compositionId = "";

            /**
             * NFCPayload compositionTitle.
             * @member {string} compositionTitle
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.compositionTitle = "";

            /**
             * NFCPayload compositionDate.
             * @member {number|Long} compositionDate
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.compositionDate = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * NFCPayload bundleMetaLastUpdated.
             * @member {string} bundleMetaLastUpdated
             * @memberof medis.nfc.NFCPayload
             * @instance
             */
            NFCPayload.prototype.bundleMetaLastUpdated = "";

            /**
             * Creates a new NFCPayload instance using the specified properties.
             * @function create
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {medis.nfc.INFCPayload=} [properties] Properties to set
             * @returns {medis.nfc.NFCPayload} NFCPayload instance
             */
            NFCPayload.create = function create(properties) {
                return new NFCPayload(properties);
            };

            /**
             * Encodes the specified NFCPayload message. Does not implicitly {@link medis.nfc.NFCPayload.verify|verify} messages.
             * @function encode
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {medis.nfc.INFCPayload} message NFCPayload message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NFCPayload.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.patient != null && Object.hasOwnProperty.call(message, "patient"))
                    $root.medis.nfc.Patient.encode(message.patient, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.poi != null && Object.hasOwnProperty.call(message, "poi"))
                    $root.medis.nfc.Stage.encode(message.poi, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.medevac != null && Object.hasOwnProperty.call(message, "medevac"))
                    $root.medis.nfc.Stage.encode(message.medevac, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.r1 != null && Object.hasOwnProperty.call(message, "r1"))
                    $root.medis.nfc.Stage.encode(message.r1, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.r2 != null && Object.hasOwnProperty.call(message, "r2"))
                    $root.medis.nfc.Stage.encode(message.r2, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.casevac != null && Object.hasOwnProperty.call(message, "casevac"))
                    $root.medis.nfc.Stage.encode(message.casevac, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.r3 != null && Object.hasOwnProperty.call(message, "r3"))
                    $root.medis.nfc.Stage.encode(message.r3, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                if (message.t != null && Object.hasOwnProperty.call(message, "t"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int64(message.t);
                if (message.bundleMetadata != null && Object.hasOwnProperty.call(message, "bundleMetadata"))
                    $root.medis.nfc.BundleMetadata.encode(message.bundleMetadata, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                if (message.allergies != null && message.allergies.length)
                    for (var i = 0; i < message.allergies.length; ++i)
                        $root.medis.nfc.Allergy.encode(message.allergies[i], writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                if (message.bundleId != null && Object.hasOwnProperty.call(message, "bundleId"))
                    writer.uint32(/* id 11, wireType 2 =*/90).string(message.bundleId);
                if (message.bundleIdentifier != null && Object.hasOwnProperty.call(message, "bundleIdentifier"))
                    writer.uint32(/* id 12, wireType 2 =*/98).string(message.bundleIdentifier);
                if (message.compositionId != null && Object.hasOwnProperty.call(message, "compositionId"))
                    writer.uint32(/* id 13, wireType 2 =*/106).string(message.compositionId);
                if (message.compositionTitle != null && Object.hasOwnProperty.call(message, "compositionTitle"))
                    writer.uint32(/* id 14, wireType 2 =*/114).string(message.compositionTitle);
                if (message.compositionDate != null && Object.hasOwnProperty.call(message, "compositionDate"))
                    writer.uint32(/* id 15, wireType 0 =*/120).int64(message.compositionDate);
                if (message.bundleMetaLastUpdated != null && Object.hasOwnProperty.call(message, "bundleMetaLastUpdated"))
                    writer.uint32(/* id 16, wireType 2 =*/130).string(message.bundleMetaLastUpdated);
                return writer;
            };

            /**
             * Encodes the specified NFCPayload message, length delimited. Does not implicitly {@link medis.nfc.NFCPayload.verify|verify} messages.
             * @function encodeDelimited
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {medis.nfc.INFCPayload} message NFCPayload message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NFCPayload.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a NFCPayload message from the specified reader or buffer.
             * @function decode
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {medis.nfc.NFCPayload} NFCPayload
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NFCPayload.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.medis.nfc.NFCPayload();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.patient = $root.medis.nfc.Patient.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.poi = $root.medis.nfc.Stage.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.medevac = $root.medis.nfc.Stage.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.r1 = $root.medis.nfc.Stage.decode(reader, reader.uint32());
                            break;
                        }
                    case 5: {
                            message.r2 = $root.medis.nfc.Stage.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            message.casevac = $root.medis.nfc.Stage.decode(reader, reader.uint32());
                            break;
                        }
                    case 7: {
                            message.r3 = $root.medis.nfc.Stage.decode(reader, reader.uint32());
                            break;
                        }
                    case 8: {
                            message.t = reader.int64();
                            break;
                        }
                    case 9: {
                            message.bundleMetadata = $root.medis.nfc.BundleMetadata.decode(reader, reader.uint32());
                            break;
                        }
                    case 10: {
                            if (!(message.allergies && message.allergies.length))
                                message.allergies = [];
                            message.allergies.push($root.medis.nfc.Allergy.decode(reader, reader.uint32()));
                            break;
                        }
                    case 11: {
                            message.bundleId = reader.string();
                            break;
                        }
                    case 12: {
                            message.bundleIdentifier = reader.string();
                            break;
                        }
                    case 13: {
                            message.compositionId = reader.string();
                            break;
                        }
                    case 14: {
                            message.compositionTitle = reader.string();
                            break;
                        }
                    case 15: {
                            message.compositionDate = reader.int64();
                            break;
                        }
                    case 16: {
                            message.bundleMetaLastUpdated = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a NFCPayload message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {medis.nfc.NFCPayload} NFCPayload
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NFCPayload.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a NFCPayload message.
             * @function verify
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            NFCPayload.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.patient != null && message.hasOwnProperty("patient")) {
                    var error = $root.medis.nfc.Patient.verify(message.patient);
                    if (error)
                        return "patient." + error;
                }
                if (message.poi != null && message.hasOwnProperty("poi")) {
                    var error = $root.medis.nfc.Stage.verify(message.poi);
                    if (error)
                        return "poi." + error;
                }
                if (message.medevac != null && message.hasOwnProperty("medevac")) {
                    var error = $root.medis.nfc.Stage.verify(message.medevac);
                    if (error)
                        return "medevac." + error;
                }
                if (message.r1 != null && message.hasOwnProperty("r1")) {
                    var error = $root.medis.nfc.Stage.verify(message.r1);
                    if (error)
                        return "r1." + error;
                }
                if (message.r2 != null && message.hasOwnProperty("r2")) {
                    var error = $root.medis.nfc.Stage.verify(message.r2);
                    if (error)
                        return "r2." + error;
                }
                if (message.casevac != null && message.hasOwnProperty("casevac")) {
                    var error = $root.medis.nfc.Stage.verify(message.casevac);
                    if (error)
                        return "casevac." + error;
                }
                if (message.r3 != null && message.hasOwnProperty("r3")) {
                    var error = $root.medis.nfc.Stage.verify(message.r3);
                    if (error)
                        return "r3." + error;
                }
                if (message.t != null && message.hasOwnProperty("t"))
                    if (!$util.isInteger(message.t) && !(message.t && $util.isInteger(message.t.low) && $util.isInteger(message.t.high)))
                        return "t: integer|Long expected";
                if (message.bundleMetadata != null && message.hasOwnProperty("bundleMetadata")) {
                    var error = $root.medis.nfc.BundleMetadata.verify(message.bundleMetadata);
                    if (error)
                        return "bundleMetadata." + error;
                }
                if (message.allergies != null && message.hasOwnProperty("allergies")) {
                    if (!Array.isArray(message.allergies))
                        return "allergies: array expected";
                    for (var i = 0; i < message.allergies.length; ++i) {
                        var error = $root.medis.nfc.Allergy.verify(message.allergies[i]);
                        if (error)
                            return "allergies." + error;
                    }
                }
                if (message.bundleId != null && message.hasOwnProperty("bundleId"))
                    if (!$util.isString(message.bundleId))
                        return "bundleId: string expected";
                if (message.bundleIdentifier != null && message.hasOwnProperty("bundleIdentifier"))
                    if (!$util.isString(message.bundleIdentifier))
                        return "bundleIdentifier: string expected";
                if (message.compositionId != null && message.hasOwnProperty("compositionId"))
                    if (!$util.isString(message.compositionId))
                        return "compositionId: string expected";
                if (message.compositionTitle != null && message.hasOwnProperty("compositionTitle"))
                    if (!$util.isString(message.compositionTitle))
                        return "compositionTitle: string expected";
                if (message.compositionDate != null && message.hasOwnProperty("compositionDate"))
                    if (!$util.isInteger(message.compositionDate) && !(message.compositionDate && $util.isInteger(message.compositionDate.low) && $util.isInteger(message.compositionDate.high)))
                        return "compositionDate: integer|Long expected";
                if (message.bundleMetaLastUpdated != null && message.hasOwnProperty("bundleMetaLastUpdated"))
                    if (!$util.isString(message.bundleMetaLastUpdated))
                        return "bundleMetaLastUpdated: string expected";
                return null;
            };

            /**
             * Creates a NFCPayload message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {medis.nfc.NFCPayload} NFCPayload
             */
            NFCPayload.fromObject = function fromObject(object) {
                if (object instanceof $root.medis.nfc.NFCPayload)
                    return object;
                var message = new $root.medis.nfc.NFCPayload();
                if (object.patient != null) {
                    if (typeof object.patient !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.patient: object expected");
                    message.patient = $root.medis.nfc.Patient.fromObject(object.patient);
                }
                if (object.poi != null) {
                    if (typeof object.poi !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.poi: object expected");
                    message.poi = $root.medis.nfc.Stage.fromObject(object.poi);
                }
                if (object.medevac != null) {
                    if (typeof object.medevac !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.medevac: object expected");
                    message.medevac = $root.medis.nfc.Stage.fromObject(object.medevac);
                }
                if (object.r1 != null) {
                    if (typeof object.r1 !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.r1: object expected");
                    message.r1 = $root.medis.nfc.Stage.fromObject(object.r1);
                }
                if (object.r2 != null) {
                    if (typeof object.r2 !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.r2: object expected");
                    message.r2 = $root.medis.nfc.Stage.fromObject(object.r2);
                }
                if (object.casevac != null) {
                    if (typeof object.casevac !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.casevac: object expected");
                    message.casevac = $root.medis.nfc.Stage.fromObject(object.casevac);
                }
                if (object.r3 != null) {
                    if (typeof object.r3 !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.r3: object expected");
                    message.r3 = $root.medis.nfc.Stage.fromObject(object.r3);
                }
                if (object.t != null)
                    if ($util.Long)
                        (message.t = $util.Long.fromValue(object.t)).unsigned = false;
                    else if (typeof object.t === "string")
                        message.t = parseInt(object.t, 10);
                    else if (typeof object.t === "number")
                        message.t = object.t;
                    else if (typeof object.t === "object")
                        message.t = new $util.LongBits(object.t.low >>> 0, object.t.high >>> 0).toNumber();
                if (object.bundleMetadata != null) {
                    if (typeof object.bundleMetadata !== "object")
                        throw TypeError(".medis.nfc.NFCPayload.bundleMetadata: object expected");
                    message.bundleMetadata = $root.medis.nfc.BundleMetadata.fromObject(object.bundleMetadata);
                }
                if (object.allergies) {
                    if (!Array.isArray(object.allergies))
                        throw TypeError(".medis.nfc.NFCPayload.allergies: array expected");
                    message.allergies = [];
                    for (var i = 0; i < object.allergies.length; ++i) {
                        if (typeof object.allergies[i] !== "object")
                            throw TypeError(".medis.nfc.NFCPayload.allergies: object expected");
                        message.allergies[i] = $root.medis.nfc.Allergy.fromObject(object.allergies[i]);
                    }
                }
                if (object.bundleId != null)
                    message.bundleId = String(object.bundleId);
                if (object.bundleIdentifier != null)
                    message.bundleIdentifier = String(object.bundleIdentifier);
                if (object.compositionId != null)
                    message.compositionId = String(object.compositionId);
                if (object.compositionTitle != null)
                    message.compositionTitle = String(object.compositionTitle);
                if (object.compositionDate != null)
                    if ($util.Long)
                        (message.compositionDate = $util.Long.fromValue(object.compositionDate)).unsigned = false;
                    else if (typeof object.compositionDate === "string")
                        message.compositionDate = parseInt(object.compositionDate, 10);
                    else if (typeof object.compositionDate === "number")
                        message.compositionDate = object.compositionDate;
                    else if (typeof object.compositionDate === "object")
                        message.compositionDate = new $util.LongBits(object.compositionDate.low >>> 0, object.compositionDate.high >>> 0).toNumber();
                if (object.bundleMetaLastUpdated != null)
                    message.bundleMetaLastUpdated = String(object.bundleMetaLastUpdated);
                return message;
            };

            /**
             * Creates a plain object from a NFCPayload message. Also converts values to other types if specified.
             * @function toObject
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {medis.nfc.NFCPayload} message NFCPayload
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            NFCPayload.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.allergies = [];
                if (options.defaults) {
                    object.patient = null;
                    object.poi = null;
                    object.medevac = null;
                    object.r1 = null;
                    object.r2 = null;
                    object.casevac = null;
                    object.r3 = null;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.t = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.t = options.longs === String ? "0" : 0;
                    object.bundleMetadata = null;
                    object.bundleId = "";
                    object.bundleIdentifier = "";
                    object.compositionId = "";
                    object.compositionTitle = "";
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.compositionDate = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.compositionDate = options.longs === String ? "0" : 0;
                    object.bundleMetaLastUpdated = "";
                }
                if (message.patient != null && message.hasOwnProperty("patient"))
                    object.patient = $root.medis.nfc.Patient.toObject(message.patient, options);
                if (message.poi != null && message.hasOwnProperty("poi"))
                    object.poi = $root.medis.nfc.Stage.toObject(message.poi, options);
                if (message.medevac != null && message.hasOwnProperty("medevac"))
                    object.medevac = $root.medis.nfc.Stage.toObject(message.medevac, options);
                if (message.r1 != null && message.hasOwnProperty("r1"))
                    object.r1 = $root.medis.nfc.Stage.toObject(message.r1, options);
                if (message.r2 != null && message.hasOwnProperty("r2"))
                    object.r2 = $root.medis.nfc.Stage.toObject(message.r2, options);
                if (message.casevac != null && message.hasOwnProperty("casevac"))
                    object.casevac = $root.medis.nfc.Stage.toObject(message.casevac, options);
                if (message.r3 != null && message.hasOwnProperty("r3"))
                    object.r3 = $root.medis.nfc.Stage.toObject(message.r3, options);
                if (message.t != null && message.hasOwnProperty("t"))
                    if (typeof message.t === "number")
                        object.t = options.longs === String ? String(message.t) : message.t;
                    else
                        object.t = options.longs === String ? $util.Long.prototype.toString.call(message.t) : options.longs === Number ? new $util.LongBits(message.t.low >>> 0, message.t.high >>> 0).toNumber() : message.t;
                if (message.bundleMetadata != null && message.hasOwnProperty("bundleMetadata"))
                    object.bundleMetadata = $root.medis.nfc.BundleMetadata.toObject(message.bundleMetadata, options);
                if (message.allergies && message.allergies.length) {
                    object.allergies = [];
                    for (var j = 0; j < message.allergies.length; ++j)
                        object.allergies[j] = $root.medis.nfc.Allergy.toObject(message.allergies[j], options);
                }
                if (message.bundleId != null && message.hasOwnProperty("bundleId"))
                    object.bundleId = message.bundleId;
                if (message.bundleIdentifier != null && message.hasOwnProperty("bundleIdentifier"))
                    object.bundleIdentifier = message.bundleIdentifier;
                if (message.compositionId != null && message.hasOwnProperty("compositionId"))
                    object.compositionId = message.compositionId;
                if (message.compositionTitle != null && message.hasOwnProperty("compositionTitle"))
                    object.compositionTitle = message.compositionTitle;
                if (message.compositionDate != null && message.hasOwnProperty("compositionDate"))
                    if (typeof message.compositionDate === "number")
                        object.compositionDate = options.longs === String ? String(message.compositionDate) : message.compositionDate;
                    else
                        object.compositionDate = options.longs === String ? $util.Long.prototype.toString.call(message.compositionDate) : options.longs === Number ? new $util.LongBits(message.compositionDate.low >>> 0, message.compositionDate.high >>> 0).toNumber() : message.compositionDate;
                if (message.bundleMetaLastUpdated != null && message.hasOwnProperty("bundleMetaLastUpdated"))
                    object.bundleMetaLastUpdated = message.bundleMetaLastUpdated;
                return object;
            };

            /**
             * Converts this NFCPayload to JSON.
             * @function toJSON
             * @memberof medis.nfc.NFCPayload
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            NFCPayload.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for NFCPayload
             * @function getTypeUrl
             * @memberof medis.nfc.NFCPayload
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            NFCPayload.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/medis.nfc.NFCPayload";
            };

            return NFCPayload;
        })();

        return nfc;
    })();

    return medis;
})();

module.exports = $root;
