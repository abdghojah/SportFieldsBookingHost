import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: './index.html',
        adminreservations: './admin-reservations.html',
        cancelreservation: './cancel-reservation.html',
        contact: './contact.html',
        fieldform: './field-form.html',
        fieldreservations: './field-reservations.html',
        howitworks: './how-it-works.html',
        login: './login.html',
        signup: './owner-signup.html',
        placefields: './place-fields.html',
        place: './place.html',
        reserve: './reserve.html',
        resetpassword: './reset-password.html',
        subscribedfields: './subscribed-fields.html',
      },
    },
  },
});