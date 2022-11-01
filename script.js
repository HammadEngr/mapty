'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

//Parent Class
class WorkOut {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    this.description = `${this.type.replace(
      this.type[0],
      this.type[0].toUpperCase()
    )} on ${this.date.getDate()},${months[this.date.getMonth()]}`;
  }
}
//child class for running
class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
//child class for cycling
class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////////////////////////////////////////////////
// code refractoring class

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let coord;
class App {
  // Private variales
  #map;
  #mapEvent;
  #workouts = [];
  // #workout;

  // instant Execution in constructor
  constructor() {
    // get position
    this._getPosition();
    // get local storage
    this._getLocalStorage();
    //submit form
    form.addEventListener('submit', this._newWorkout.bind(this));
    //Event listeners
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  //Methods in Class
  //1
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log('Can not find your location');
        }
      );
  }
  //2
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    coord = [latitude, longitude];
    console.log(
      `https://www.google.com/maps/place/Jhelum,+Punjab,+Pakistan/@${latitude},${longitude}`
    );
    this.#map = L.map('map').setView(coord, 13);
    //   console.log(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }
  //3
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
  }
  //4
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  //5
  _newWorkout(e) {
    e.preventDefault();

    // get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng; // latitude and longitude
    let workout;
    // Data validation functions
    const ifNumber = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const ifNegative = (...inputs) => inputs.every(val => val > 0);

    //if workout is runnig, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !ifNumber(distance, duration, cadence) ||
        !ifNegative(distance, duration, cadence)
      )
        return alert('inputs must be numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
      console.log(this.#workouts);

      // alert('input must be numbers greater than 0');
    }
    // if workout is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !ifNumber(distance, duration, elevation) ||
        !ifNegative(distance, duration)
      )
        return alert('inputs must be numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add new object to the workouts array

    this.#workouts.push(workout);
    // render workout on map as a marker
    this._renderWorkOutMarker(workout);

    // render workout on list
    this._renderWorkOutList(workout);

    // hide the form and clear input fields.
    this._hideForm();

    // Local STorage
    this._setLocalStorage();
  }

  _renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkOutList(workout) {
    let html;
    html = `
    <li class="workout workout--${workout.type}" data-id=${workout.id}>
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(i => i.id === workoutEl.dataset.id);
    console.log(workout);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(w => this._renderWorkOutList(w));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
