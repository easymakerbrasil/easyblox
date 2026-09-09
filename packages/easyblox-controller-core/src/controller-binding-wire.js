const {Buffer} = require('buffer');

const {
    createControllerBindingReference,
    getControllerBindingReferenceContract
} = require('./controller-binding');

const {
    getControllerComponentBindingContract
} = require('./controller-binding-contract');

const CONTROLLER_BINDING_WIRE_CONTRACT = Object.freeze({
    version:
        1,
    channelPrefix:
        'C1.',
    hashHexLength:
        8,
    channelLength:
        11
});

const CHANNEL_PATTERN =
    /^C1\.[0-9A-F]{8}$/;

const hashBindingReference =
    bindingReference => {
        const canonical =
            JSON.stringify([
                bindingReference.componentId,
                bindingReference.port
            ]);

        const bytes =
            Buffer.from(
                canonical,
                'utf8'
            );

        let hash =
            0x811C9DC5;

        for (const byte of bytes) {
            hash ^=
                byte;

            hash =
                Math.imul(
                    hash,
                    0x01000193
                ) >>>
                0;
        }

        return hash;
    };

const getControllerBindingWireChannel =
    (
        model,
        bindingReference
    ) => {
        getControllerBindingReferenceContract(
            model,
            bindingReference
        );

        const hash =
            hashBindingReference(
                bindingReference
            );

        const hashHex =
            hash
                .toString(16)
                .toUpperCase()
                .padStart(
                    CONTROLLER_BINDING_WIRE_CONTRACT.hashHexLength,
                    '0'
                );

        return (
            CONTROLLER_BINDING_WIRE_CONTRACT.channelPrefix +
            hashHex
        );
    };

const assertWireChannel =
    channel => {
        if (
            typeof channel !==
                'string' ||
            !CHANNEL_PATTERN.test(
                channel
            )
        ) {
            throw new Error(
                'Invalid controller binding wire channel'
            );
        }
    };

class ControllerBindingWireRegistry {
    constructor (model) {
        if (
            !model ||
            typeof model.getComponents !==
                'function'
        ) {
            throw new Error(
                'Controller binding wire registry requires a Controller model'
            );
        }

        this._model =
            model;

        this._entries =
            [];

        this._channels =
            new Map();

        this._bindingChannels =
            new Map();

        this._build();
    }

    getChannel (
        bindingReference
    ) {
        getControllerBindingReferenceContract(
            this._model,
            bindingReference
        );

        const key =
            this._getBindingKey(
                bindingReference
            );

        const channel =
            this._bindingChannels.get(
                key
            );

        if (!channel) {
            throw new Error(
                'Unknown controller binding reference'
            );
        }

        return channel;
    }

    getBinding (
        channel
    ) {
        assertWireChannel(
            channel
        );

        const binding =
            this._channels.get(
                channel
            );

        if (!binding) {
            throw new Error(
                `Unknown controller binding wire channel: ${channel}`
            );
        }

        return binding;
    }

    getEntries () {
        return this._entries.map(
            entry =>
                Object.freeze({
                    channel:
                        entry.channel,
                    binding:
                        entry.binding
                })
        );
    }

    _build () {
        for (
            const component of
                this._model.getComponents()
        ) {
            const componentContract =
                getControllerComponentBindingContract(
                    component.type
                );

            for (
                const port of
                    Object.keys(
                        componentContract
                    )
            ) {
                const binding =
                    createControllerBindingReference(
                        this._model,
                        component.id,
                        port
                    );

                const channel =
                    getControllerBindingWireChannel(
                        this._model,
                        binding
                    );

                const existingBinding =
                    this._channels.get(
                        channel
                    );

                if (
                    existingBinding &&
                    (
                        existingBinding.componentId !==
                            binding.componentId ||
                        existingBinding.port !==
                            binding.port
                    )
                ) {
                    throw new Error(
                        `Controller binding wire channel collision: ${channel}`
                    );
                }

                const key =
                    this._getBindingKey(
                        binding
                    );

                this._channels.set(
                    channel,
                    binding
                );

                this._bindingChannels.set(
                    key,
                    channel
                );

                this._entries.push(
                    Object.freeze({
                        channel,
                        binding
                    })
                );
            }
        }
    }

    _getBindingKey (
        bindingReference
    ) {
        return JSON.stringify([
            bindingReference.componentId,
            bindingReference.port
        ]);
    }
}

module.exports = {
    CONTROLLER_BINDING_WIRE_CONTRACT,
    ControllerBindingWireRegistry,
    getControllerBindingWireChannel
};
