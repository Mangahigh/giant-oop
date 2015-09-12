/*global giant */
(function () {
    "use strict";

    /**
     * @class
     * @ignore
     */
    giant.AmendUtils = {
        /**
         * Retrieves amendments from postponed definition.
         * Returns empty array when argument is not property descriptor or descriptor has no amendments assigned.
         * @param {object} [propertyDescriptor]
         * @returns {Array}
         */
        getAmendments: function (propertyDescriptor) {
            return giant.validators.isSetterGetterDescriptor(propertyDescriptor) &&
                   propertyDescriptor.get.amendments ||
                   [];
        },

        /**
         * Sets amendments on postponed definition. Overwrites previous amendments.
         * @param {object} propertyDescriptor
         * @param {object[]} amendments
         */
        setAmendments: function (propertyDescriptor, amendments) {
            var propertyGetter = propertyDescriptor.get;
            propertyGetter.amendments = amendments;
        },

        /**
         * @param {object} propertyDescriptor
         * @param {function} modifier
         * @param {Array} modifierArguments
         */
        addAmendment: function (propertyDescriptor, modifier, modifierArguments) {
            var propertyGetter = propertyDescriptor.get;

            propertyGetter.amendments = propertyGetter.amendments || [];

            propertyGetter.amendments.push({
                modifier: modifier,
                args    : modifierArguments
            });
        },

        /**
         * Applies specified amendments to the specified property descriptor.
         * @param {object} propertyDescriptor
         * @param {object[]} amendments
         */
        applyAmendments: function (propertyDescriptor, amendments) {
            var i, amendment;

            if (amendments instanceof Array) {
                for (i = 0; i < amendments.length; i++) {
                    amendment = amendments[i];
                    amendment.modifier.apply(giant, amendment.args);
                }
            }
        }
    };
}());