let activePlayer;
for (const root of document.querySelectorAll('[data-track]')) {

    const audio = root.querySelector('[data-role="audio"]');
    const toggle = root.querySelector('[data-role="toggle"]');
    const player = root.querySelector('.player');
    const seek = root.querySelector('[data-role="seek"]');
    const elapsed = root.querySelector('[data-role="elapsed"]');
    const duration = root.querySelector('[data-role="duration"]');
    const status = root.querySelector('[data-role="status"]');
    const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    const title = root.dataset.title;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let transport = audio;
    let animationFrame;

    function syncDuration() {
      if (!Number.isFinite(transport.duration)) return;
      duration.textContent = formatTime(transport.duration);
      seek.max = transport.duration;
      seek.disabled = false;
    }
    function syncPosition() {
      const position = transport.currentTime;
      seek.value = position;
      elapsed.textContent = formatTime(position);
      seek.parentElement.style.setProperty('--progress', `${transport.duration ? position / transport.duration * 100 : 0}%`);
      seek.setAttribute('aria-valuetext', `${formatTime(position)} of ${formatTime(transport.duration || 0)}`);
    }
    function syncPlayback() {
      toggle.classList.toggle('playing', !transport.paused);
      if (transport.paused) player.classList.remove('is-playing');
      toggle.setAttribute('aria-label', transport.paused ? `Play ${title}` : `Pause ${title}`);
    }

    if (AudioContextClass && location.protocol !== 'file:') {
      let context, buffer, bufferPromise, source;
      let offset = 0;
      let startedAt = 0;
      let wantsPlayback = false;
      let request = 0;

      // Decode once and loop on the audio clock, without an MP3 seek at each repeat.
      // Overlap just 30 ms of the tail and head to remove the waveform discontinuity.
      function blendLoop(decoded) {
        const overlap = Math.min(Math.round(decoded.sampleRate * 0.03), Math.floor(decoded.length / 2));
        if (overlap < 2) return decoded;
        const length = decoded.length - overlap;
        const loop = context.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate);
        for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
          const input = decoded.getChannelData(channel);
          const output = loop.getChannelData(channel);
          output.set(input.subarray(0, length));
          for (let i = 0; i < overlap; i++) {
            const mix = 0.5 - 0.5 * Math.cos(Math.PI * i / (overlap - 1));
            output[i] = input[length + i] * (1 - mix) + input[i] * mix;
          }
        }
        return loop;
      }
      function loadBuffer() {
        if (!bufferPromise) {
          bufferPromise = fetch(root.dataset.loopSrc || audio.currentSrc || audio.src)
            .then(response => {
              if (!response.ok) throw new Error('Unable to load audio');
              return response.arrayBuffer();
            })
            .then(data => context.decodeAudioData(data))
            .then(decoded => {
              buffer = root.dataset.loopSrc ? decoded : blendLoop(decoded);
              syncDuration();
              return buffer;
            })
            .catch(error => { bufferPromise = null; throw error; });
        }
        return bufferPromise;
      }
      function stopSource() {
        if (!source) return;
        source.stop();
        source.disconnect();
        source = null;
      }
      function startSource() {
        stopSource();
        offset %= buffer.duration;
        source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(context.destination);
        startedAt = context.currentTime;
        source.start(startedAt, offset);
      }
      function animate() {
        syncPosition();
        if (source) animationFrame = requestAnimationFrame(animate);
      }
      transport = {
        get duration() { return buffer ? buffer.duration : audio.duration; },
        get paused() { return !wantsPlayback; },
        get currentTime() {
          return source ? (offset + context.currentTime - startedAt) % buffer.duration : offset;
        },
        set currentTime(value) {
          offset = Math.max(0, value);
          if (buffer) offset %= buffer.duration;
          if (source) startSource();
          syncPosition();
        },
        async play() {
          wantsPlayback = true;
          const currentRequest = ++request;
          syncPlayback();
          try {
            // Resume inside the user gesture, before fetching, for mobile Safari.
            if (!context) {
              context = new AudioContextClass();
              context.addEventListener('statechange', () => {
                if (wantsPlayback && context.state !== 'running') {
                  transport.pause();
                  status.textContent = '';
                }
              });
            }
            await Promise.all([context.resume(), loadBuffer()]);
            if (currentRequest !== request || !wantsPlayback) return;
            if (context.state !== 'running') throw new Error('Audio was interrupted');
            startSource();
            player.classList.add('is-playing');
            cancelAnimationFrame(animationFrame);
            animate();
          } catch (error) {
            if (currentRequest !== request) return;
            wantsPlayback = false;
            syncPlayback();
            throw error;
          }
        },
        pause() {
          offset = this.currentTime;
          wantsPlayback = false;
          request++;
          stopSource();
          cancelAnimationFrame(animationFrame);
          syncPlayback();
          syncPosition();
        }
      };
      // A restored page must not retain a stale "playing" state after navigation.
      window.addEventListener('pagehide', () => transport.pause());
    } else {
      // Keep the native controls functional in browsers without Web Audio.
      audio.addEventListener('timeupdate', syncPosition);
      for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, syncPlayback);
      audio.addEventListener('waiting', () => { status.textContent = 'Loading…'; player.classList.remove('is-playing'); });
      audio.addEventListener('playing', () => { status.textContent = ''; player.classList.add('is-playing'); });
      audio.addEventListener('error', () => { status.textContent = 'The song could not load. Please refresh to try again.'; });
    }
    let toggleRequest = 0;
    const controller = {
      pause() {
        toggleRequest++;
        transport.pause();
        status.textContent = '';
      }
    };
    toggle.addEventListener('click', async () => {
      const currentRequest = ++toggleRequest;
      if (!transport.paused) { transport.pause(); status.textContent = ''; return; }
      if (activePlayer && activePlayer !== controller) activePlayer.pause();
      activePlayer = controller;
      status.textContent = 'Loading…';
      try {
        await transport.play();
        if (currentRequest === toggleRequest) status.textContent = '';
      } catch {
        if (currentRequest === toggleRequest) status.textContent = 'Unable to play. Please try again.';
      }
    });
    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    seek.addEventListener('input', () => { transport.currentTime = Number(seek.value); });
    syncDuration();
    root.classList.add('enhanced');
  
}
