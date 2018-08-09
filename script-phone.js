/* eslint-disable require-jsdoc */
function initPeer(key) {
    // Peer object
    const peer = new Peer({
        key: key,
        debug: 3,
    });

    let localStream;
    let existingCall;

    peer.on('open', () => {
        $('#my-id').text(peer.id);
        step1();
        step2();
    });

    // Receiving a call
    peer.on('call', call => {
        // Answer the call automatically (instead of prompting user) for demo purposes
        call.answer(localStream);
        step3(call);
    });

    peer.on('error', err => {
        alert(err.message);
        // Return to step 2 if error occurs
        step2();
    });

    $('#make-call').on('submit', e => {
        e.preventDefault();
        // Initiate a call!
        console.log($('#callto-id').val());
        const call = peer.call($('#callto-id').val(), localStream);
        step3(call);
    });

    $('#end-call').on('click', () => {
        existingCall.close();
        step2();
    });

    // Retry if getUserMedia fails
    $('#step1-retry').on('click', () => {
        $('#step1-error').hide();
        step1();
    });

    // set up audio and video input selectors
    const audioSelect = $('#audioSource');
    const selectors = [audioSelect];

    navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
            const values = selectors.map(select => select.val() || '');

            selectors.forEach(select => {
                const children = select.children(':first');
                while (children.length) {
                    select.remove(children);
                }
            });

            for (let i = 0; i !== deviceInfos.length; ++i) {
                const deviceInfo = deviceInfos[i];
                const option = $('<option>').val(deviceInfo.deviceId);

                if (deviceInfo.kind === 'audioinput') {
                    option.text(deviceInfo.label ||
                        'Microphone ' + (audioSelect.children().length + 1));
                    audioSelect.append(option);
                }
            }

            selectors.forEach((select, selectorIndex) => {
                if (Array.prototype.slice.call(audioSelect.children()).some(n => {
                    return n.value === values[selectorIndex];
                })) {
                    audioSelect.val(values[selectorIndex]);
                }
            });

            audioSelect.on('change', step1);
        });

    function step1() {
        const audioSource = $('#audioSource').val();
        const constraints = {
            audio: { deviceId: audioSource ? { exact: audioSource } : undefined }
        };

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            $('#my-video').get(0).srcObject = stream;
            localStream = stream;

            if (existingCall) {
                existingCall.replaceStream(stream);
                return;
            }
        }).catch(eer => {
            $('#step1-error').show();
            console.error(err);
        });
        step2();
    }

    function step2() {
        $('#step1').hide();
        $('#step2').show();
        $('#callto-id').focus();
    }

    function step3(call) {
        // Hang up on an existing call if present
        if (existingCall) {
            existingCall.close();
        }
        // Wait for stream on the call, then set peer video display
        call.on('stream', stream => {
            $('#their-video').get(0).srcObject = stream;
        });

        // UI stuff
        existingCall = call;
        $('#their-id').text(call.remoteId);
        call.on('close', step2);
        $('#step1, #step2').hide();
        $('#step3').show();
    }
};
