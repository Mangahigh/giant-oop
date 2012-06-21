/**
 * General purpose OOP functionality: class extension, instantiation, property delegation.
 */
var troop = troop || {};

(function ($properties) {
    troop.inheritance = {
        /**
         * Extends base class with methods.
         * Extended class will have methods as read-only own properties.
         * @this {object} Base class.
         * @param [methods] {object} Object containing methods {public, read-only}.
         * @return {object}
         */
        extend: function (methods) {
            var c = Object.create(this),
                result = methods ?
                    $properties.addMethod.call(c, methods) :
                    c;

            /**
             * Extending once more with no own properties
             * so that methods may be mocked on a static level.
             */
            if (troop.testing === true) {
                result = Object.create(result);
            }

            return result;
        },

        /**
         * Creates an instance of a class, ie. creates a new object and adds writable
         * properties to it.
         * @this {object} Class to instantiate.
         * @param [properties] {object} Object containing properties (public, writable)
         * @return {object}
         */
        instantiate: function (properties) {
            var o = Object.create(this),
                result = properties ?
                    $properties.addPublic.call(o, properties) :
                    o;

            return result;
        }
    };
}(
    troop.properties
));