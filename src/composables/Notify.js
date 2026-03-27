import { Notify } from "quasar";

const exitoNotify = function(message) {
    return Notify.create({
        type: 'positive',
        message: message,
        position: 'top-right'
    });
}

const errorNotify = function(error) {
    return Notify.create({
        type: 'negative',
        message: error,
        position: 'top'
    });
}

export { exitoNotify, errorNotify };