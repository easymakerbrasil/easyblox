const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((accept, fail) => {
        resolve = accept;
        reject = fail;
    });
    return {promise, resolve, reject};
};
const waitForTurn = function (resolve) {
    setTimeout(() => resolve(), 0);
};
const flush = () => new Promise(waitForTurn);
const createStream = () => {
    const track = {stop: jest.fn()};
    return {track, stream: {active: true, getTracks: () => [track], getAudioTracks: () => [track]}};
};
const createAudioContext = () => {
    const context = new EventTarget();
    const node = () => {
        const result = {connect: jest.fn(), disconnect: jest.fn()};
        context.nodes.push(result);
        return result;
    };
    Object.assign(context, {
        state: 'running',
        sampleRate: 44100,
        currentTime: 0,
        destination: {},
        nodes: [],
        level: 0.1,
        resume: jest.fn().mockResolvedValue(),
        suspend: jest.fn().mockResolvedValue(),
        close: jest.fn(() => {
            context.state = 'closed';
            context.dispatchEvent(new Event('statechange'));
            return Promise.resolve();
        }),
        createGain: jest.fn(node),
        createMediaStreamSource: jest.fn(node),
        createScriptProcessor: jest.fn(node),
        createAnalyser: jest.fn(() => {
            const fillSamples = function (samples) {
                samples.fill(context.level);
            };
            return Object.assign(node(), {
                fftSize: 8, frequencyBinCount: 4, getFloatTimeDomainData: jest.fn(fillSamples)
            });
        })
    });
    return context;
};
export {deferred, flush, createStream, createAudioContext};
