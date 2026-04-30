import { Notify } from "quasar";

export const exitoNotify = (message) => {
    Notify.create({
        type: 'positive',
        message: message,
        position: 'top-right'
    });
}

export const errorNotify = (error) => {
    Notify.create({
        type: 'negative',
        message: error,
        position: 'top'
    });
}