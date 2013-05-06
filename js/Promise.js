/**
 * Promise Addition.
 *
 * API to add properties to objects as promises.
 * A promise means that the property will be evaluated upon first access.
 */
/*global dessert, troop, console */
(function () {
    "use strict";

    var hOP = Object.prototype.hasOwnProperty;

    troop.Base.addMethod.call(troop, /** @lends troop */{
        /**
         * Promises a property definition (read-only).
         * @param {object} host Host object.
         * @param {string} propertyName Property name.
         * @param {function} generator Generates (and returns) property value.
         */
        promise: function (host, propertyName, generator) {
            dessert
                .isObject(host, "Host is not an Object")
                .isString(propertyName, "Invalid property name")
                .isFunction(generator, "Invalid generator function");

            var sliceArguments = Array.prototype.slice.bind(arguments),
                generatorArguments;

            // checking whether property is already defined
            if (hOP.call(host, propertyName)) {
                return;
            }

            // rounding up rest of the arguments
            generatorArguments = sliceArguments(0, 2).concat(sliceArguments(3));

            // placing class promise on namespace as getter
            Object.defineProperty(host, propertyName, {
                get: function () {
                    // obtaining property value
                    var value = generator.apply(this, generatorArguments);

                    if (typeof value !== 'undefined') {
                        // generator returned a property value
                        // overwriting promise with actual property value
                        Object.defineProperty(host, propertyName, {
                            value       : value,
                            writable    : false,
                            enumerable  : true,
                            configurable: false
                        });
                    } else {
                        // no return value
                        // generator supposedly assigned value to property
                        value = host[propertyName];
                    }

                    return value;
                },

                set: function (value) {
                    // overwriting promise with property value
                    Object.defineProperty(host, propertyName, {
                        value       : value,
                        writable    : false,
                        enumerable  : true,
                        configurable: false
                    });
                },

                enumerable  : true,
                configurable: true  // must be configurable in order to be re-defined
            });
        }
    });
}());