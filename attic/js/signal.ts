//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="common.ts" />

module Exposition {

    /**
     * Implement design pattern Observer, via the signal and slots.
     *
     * Signal instances should be added as public properties of classes. 
     * Subscribers can use the on/off method, to connect their slots to the signal.
     * Emitters should use the fire() method. 
     *
     * At the moment, because of the lack of generics, all type information is lost.
     *
     */
    export class Signal<CallbackType> {
        // Private
        private list = [];

        /** Add listener */
        public on(listener: CallbackType) {
            assert(this.list.indexOf(listener) === -1);
            assert(typeof listener === 'function');
            this.list.push(listener);
        }

        /** Remove listener */
        public off(listener: CallbackType) {
            assert(typeof listener === 'function');
            var index = this.list.indexOf(listener);
            assert(index !== -1);
            this.list.splice(index, 1);
        }

        /** Fire the signal */
        public fire: CallbackType;

        constructor() {
            var fire = () => {
                for (var i=0; i<this.list.length; ++i) {
                    this.list[i].apply(/*this object*/null , arguments);
                }
            }
            this.fire = <any>fire;
        }
    };    

}

