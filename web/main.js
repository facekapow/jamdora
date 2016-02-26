'use strict';

window.addEventListener('beforeunload', function() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/remove-token');
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.send(JSON.stringify({
    aAP: window.aAP,
    aP: window.aP,
    aT: window.aT
  }));
});

function fetchInfo(cb) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('readystatechange', function() {
    if (xhr.readyState === 4) {
      cb(JSON.parse(xhr.responseText));
    }
  });
  xhr.open('GET', '/track-info');
  xhr.send();
}

window.addEventListener('DOMContentLoaded', function() {
  function resize() {
    var h = document.documentElement.clientHeight || document.get('body')[0].clientHeight;
    var w = document.documentElement.clientWidth || document.get('body')[0].clientWidth;
    var cont = document.get('#cont');
    cont.css({
      marginTop: (parseInt(h) - cont.clientHeight)/2 + 'px',
      marginLeft: (parseInt(w) - cont.clientWidth)/2 + 'px'
    });
  }
  window.addEventListener('resize', resize);
  resize();
  document.get('#loginButton').addEventListener('click', function() {
    var getTok = new XMLHttpRequest();
    getTok.addEventListener('readystatechange', function() {
      if (getTok.readyState === 4) {
        if (getTok.status === 403) {
          sweetAlert("Uh oh...", "Are you sure that's the right username and password?", "error");
          return;
        }
        var obj = JSON.parse(getTok.responseText);
        window.aT = obj.aT;
        window.aAP = obj.aAP;
        window.aP = obj.aP;
        document.get('#login').css('display', 'none');
        document.get('#player').css('display', 'inline-block');
        var loading = document.get('#loading');
        if (loading.hasClass('is-active')) loading.removeClass('is-active');
        var music = document.get('#musicElm');
        music.info = {};
          var prog = document.get('#progress');
          var pimg = document.get('#playerImage');
          var pinfo = document.get('#playerInfo');
          pimg.css('display', 'none');
          pinfo.css('display', 'none');
          prog.css({
            width: '150px',
            display: 'inline-block'
          });
          var player = document.get('#player');
          var pp = document.get('#pausePlay');
          var ppi = document.get('#pausePlayIcon');
          var progTime = document.get('#currentTime');
          if (music.paused) {
            ppi.innerHTML = 'play_arrow';
            pp.onclick = function() {
              music.play();
            }
          }
          music.addEventListener('play', function() {
            ppi.innerHTML = 'pause';
            pp.onclick = function() {
              music.pause();
            }
          });
          music.addEventListener('pause', function() {
            ppi.innerHTML = 'play_arrow';
            pp.onclick = function() {
              music.play();
            }
          });
          music.addEventListener('timeupdate', function() {
            var current = (music.currentTime/music.info.format.duration)*100;

              var curmin = 0;
              var cursec = music.currentTime;
                while (cursec > 60) {
                  curmin++;
                  cursec -= 60;
                }

              var curtime = curmin + ':';
              curtime += (cursec < 10) ? '0' + Math.round(cursec) : Math.round(cursec);

              var totalmin = 0;
              var totalsec = music.info.format.duration;
                while (totalsec > 60) {
                  totalmin++;
                  totalsec -= 60;
                }

              var totaltime = totalmin + ':';
              totaltime += (totalsec < 10) ? '0' + Math.round(totalsec) : Math.round(totalsec);

              prog.MaterialProgress.setProgress(current);
              progTime.innerHTML = curtime + '/' + totaltime;
          });

        var streamURL = '/stream?aT=' + window.aT + '&aAP=' + window.aAP + '&aP=' + window.aP;
        if (document.get('#shuffle').hasClass('is-checked')) {
          streamURL += '&shuffle';
        }
        music.src = streamURL;
        var is_first = true;
        function first() {
          if (is_first) {
            resize();
            // wait for the info to update:
            setTimeout(function() {
              fetchInfo(function(data) {
                if (loading.hasClass('is-active')) loading.removeClass('is-active');
                player.css('display', 'inline-block');
                music.info = data;
                if (music.info.metadata.art_url) {
                  pimg.css('display', 'block');
                  pimg.src = music.info.metadata.art_url;
                }
                if (music.info.metadata.artist && music.info.metadata.title) {
                  pinfo.css('display', 'block');
                  pinfo.text(music.info.metadata.artist + ' - ' + music.info.metadata.title);
                }
                setTimeout(resize, 600);
              });
            }, 1000);
            music.removeEventListener('playing', first);
            is_first = false;
          }
        }
        music.addEventListener('playing', first);
        music.play();
        music.addEventListener('ended', function() {
          player.css('display', 'none');
          pimg.css('display', 'none');
          pinfo.css('display', 'none');
          loading.addClass('is-active');
          var req = new XMLHttpRequest();
          req.open('POST', '/remove-token');
          req.addEventListener('readystatechange', function() {
            if (req.readyState === 4) {
              var xhr = new XMLHttpRequest();
              xhr.addEventListener('readystatechange', function() {
                if (xhr.readyState === 4) {
                  var obj = JSON.parse(xhr.responseText);
                  window.aT = obj.aT;
                  window.aAP = obj.aAP;
                  window.aP = obj.aP;
                  var streamURL = '/stream?aT=' + window.aT + '&aAP=' + window.aAP + '&aP=' + window.aP;
                  if (document.get('#shuffle').hasClass('is-checked')) {
                    streamURL += '&shuffle';
                  }
                  music.src = streamURL;
                  is_first = true;
                  music.addEventListener('playing', first);
                  music.play();
                }
              });
              xhr.open('POST', '/re-gen');
              xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
              xhr.send(JSON.stringify({
                aAP: window.aAP,
                aP: window.aP,
                aT: window.aT
              }));
            }
          });
          req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          req.send(JSON.stringify({
            aAP: window.aAP,
            aP: window.aP,
            aT: window.aT
          }));
        });
        document.getElementById('skip').addEventListener('click', function() {
          player.css('display', 'none');
          pimg.css('display', 'none');
          pinfo.css('display', 'none');
          loading.addClass('is-active');
          music.pause();
          var req = new XMLHttpRequest();
          req.open('POST', '/remove-token');
          req.addEventListener('readystatechange', function() {
            if (req.readyState === 4) {
              var xhr = new XMLHttpRequest();
              xhr.addEventListener('readystatechange', function() {
                if (xhr.readyState === 4) {
                  var obj = JSON.parse(xhr.responseText);
                  window.aT = obj.aT;
                  window.aAP = obj.aAP;
                  window.aP = obj.aP;
                  var streamURL = '/stream?aT=' + window.aT + '&aAP=' + window.aAP + '&aP=' + window.aP;
                  if (document.get('#shuffle').hasClass('is-checked')) {
                    streamURL += '&shuffle';
                  }
                  music.src = streamURL;
                  is_first = true;
                  music.addEventListener('playing', first);
                  music.play();
                }
              });
              xhr.open('POST', '/re-gen');
              xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
              xhr.send(JSON.stringify({
                aAP: window.aAP,
                aP: window.aP,
                aT: window.aT
              }));
            }
          });
          req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          req.send(JSON.stringify({
            aAP: window.aAP,
            aP: window.aP,
            aT: window.aT
          }));
        });
      }
    });
    getTok.open('POST', '/get-token');
    getTok.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    getTok.send(JSON.stringify({
      username: document.get('#usernameField').value,
      password: document.get('#passwordField').value
    }));
  });
});
