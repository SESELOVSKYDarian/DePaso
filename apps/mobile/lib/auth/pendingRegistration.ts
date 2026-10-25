/**
 * Datos del registro con email mientras se pasa del formulario a la pantalla de declaraciones.
 * Viven sólo en memoria: la contraseña nunca va por la dirección de la pantalla ni se guarda.
 */
export interface PendingRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

let pending: PendingRegistration | null = null;

export const setPendingRegistration = (value: PendingRegistration | null) => {
  pending = value;
};
export const getPendingRegistration = () => pending;
