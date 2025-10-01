// ===== CONFIGURA TU API KEY AQUÍ =====
    const API_KEY = "5618cf904c496b0a2f6f3918da7f1629"; // Crea una gratis en https://openweathermap.org/api

    // ====== STATE ======
    const state = {
      unit: localStorage.getItem('unit') || 'metric', // 'metric' (°C) o 'imperial' (°F)
      lastCity: localStorage.getItem('lastCity') || 'Guatemala City'
    };

    // ====== DOM ======
    const $ = (id) => document.getElementById(id);
    const cityInput = $('ciudad');
    const searchBtn = $('buscar');
    const nuevaBusqueda = $('nuevaBusqueda');
    const unitBtn = $('unitBtn');
    const statusEl = $('estatus');
    const cityName = $('nombreCiudad');
    const description = $('clima');
    const updatedAt = $('actualizado');
    const icon = $('icon');
    const temperature = $('temperatura');
    const humidity = $('humedad');
    const wind = $('viento');
    const feels = $('sensacion');
    const pressure = $('presion');

    // ====== HELPERS ======
    const unitLabel = () => state.unit === 'metric' ? '°C' : '°F';
    const speedLabel = () => state.unit === 'metric' ? 'm/s' : 'mph';

    function setLoading(on){
      statusEl.textContent = on ? 'Cargando…' : '';
      statusEl.className = on ? 'state loading' : 'state';
      searchBtn.disabled = !!on;
    }

    function setError(msg){
      statusEl.textContent = msg;
      statusEl.className = 'state error';
    }

    function fmtTime(ts, tzOffsetSec){
      try{
        // ts en segundos UTC, tz en segundos; convertimos a ms
        const local = new Date((ts + tzOffsetSec) * 1000);
        // Mostrar fecha y hora locales de la ciudad consultada
        return new Intl.DateTimeFormat('es-ES', { dateStyle:'medium', timeStyle:'short' }).format(local);
      }catch(e){ return '—'; }
    }

    async function fetchWeather(city){
      if(!API_KEY || API_KEY.startsWith('PON_')){
        setError('Configura tu API Key de OpenWeatherMap en el código.');
        return;
      }
      setLoading(true);
      try{
        const url = new URL('https://api.openweathermap.org/data/2.5/weather');
        url.searchParams.set('q', city);
        url.searchParams.set('appid', API_KEY);
        url.searchParams.set('units', state.unit);
        url.searchParams.set('lang', 'es');

        const res = await fetch(url);
        if(!res.ok){
          if(res.status === 404){ throw new Error('Ciudad no encontrada.'); }
          throw new Error('Error al consultar el clima.');
        }
        const data = await res.json();
        renderWeather(data);
        localStorage.setItem('lastCity', city);
      }catch(err){
        setError(err.message || 'Ocurrió un error.');
      }finally{ setLoading(false); }
    }

    function renderWeather(d){
      const { name, sys, weather, main, wind: w, dt, timezone } = d;
      cityName.textContent = `${name}${sys?.country ? ', ' + sys.country : ''}`;
      description.textContent = weather?.[0]?.description || '—';
      updatedAt.textContent = `Actualizado: ${fmtTime(dt, timezone)}`;
      const iconCode = weather?.[0]?.icon; // p.ej. 10d
      icon.src = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';
      icon.style.visibility = iconCode ? 'visible' : 'hidden';

      const temp = Math.round(main.temp);
      const feelsLike = Math.round(main.feels_like);
      const press = main.pressure;
      const hum = main.humidity;

      temperature.textContent = `${temp}${unitLabel()}`;
      feels.textContent = `${feelsLike}${unitLabel()}`;
      pressure.textContent = `${press} hPa`;
      wind.textContent = `${Math.round(w.speed)} ${speedLabel()}`;
      humidity.textContent = `${hum}%`;

      statusEl.textContent = '';
      statusEl.className = 'state';
    }

    // ====== EVENTS ======
    searchBtn.addEventListener('click', () => {
      const c = cityInput.value.trim() || state.lastCity;
      fetchWeather(c);
    });

    nuevaBusqueda.addEventListener('click',()=>{
        cityInput.value='';
        cityInput.focus();

    });

    cityInput.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        searchBtn.click();
      }
    });

    unitBtn.addEventListener('click', () => {
      state.unit = state.unit === 'metric' ? 'imperial' : 'metric';
      localStorage.setItem('unit', state.unit);
      unitBtn.textContent = state.unit === 'metric' ? '°C' : '°F';
      // refrescar clima para última ciudad si existe
      const c = cityInput.value.trim() || state.lastCity;
      if(c) fetchWeather(c);
    });

    // ====== INIT ======
    (function init(){
      unitBtn.textContent = state.unit === 'metric' ? '°C' : '°F';
      cityInput.value = state.lastCity;
      // Carga inicial
      fetchWeather(state.lastCity);
    })();