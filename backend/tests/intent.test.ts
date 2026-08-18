import { describe, expect, it } from 'vitest';

import { detectIntent, parseCredentials } from '../src/services/intent.js';

describe('detectIntent', () => {
  it('reconoce "Hola" en una frase', () => {
    const result = detectIntent('Hola');
    expect(result?.action).toBe('saludar');
    expect(result?.reply).toBe(
      '¡Hola! soy Boty, tu asistente de gestion de datos personales. ¿En que te puedo ayudar?'
    );
    expect(result?.options).toEqual([
      'Gestion de Correos y Contraseñas',
      'Recordatorios',
      'Guardar informacion',
    ]);
  });

  it('reconoce "hola" dentro de una frase más larga', () => {
    const result = detectIntent('Buenos días, hola a todos');
    expect(result?.action).toBe('saludar');
  });

  it('es insensible a mayúsculas y tildes', () => {
    const result = detectIntent('HÓLA, ¿qué tal?');
    expect(result?.action).toBe('saludar');
  });

  it('reconoce cada opción del saludo', () => {
    expect(detectIntent('Gestion de Correos y Contraseñas')?.action).toBe('gestionar_correos');
    expect(detectIntent('Recordatorios')?.action).toBe('recordatorios');
    expect(detectIntent('Guardar informacion')?.action).toBe('guardar_informacion');
  });

  it('pide credenciales al seleccionar cualquiera de las opciones', () => {
    const expected = 'Por favor, dime tu nombre de usuario y tu acceso. Si no lo tienes, dímelo y lo creamos.';
    expect(detectIntent('Gestion de Correos y Contraseñas')?.reply).toBe(expected);
    expect(detectIntent('Recordatorios')?.reply).toBe(expected);
    expect(detectIntent('Guardar informacion')?.reply).toBe(expected);
  });

  it('inicia el registro cuando el usuario no tiene cuenta', () => {
    const expected = '¡Perfecto! Vamos a crear tu cuenta. Dime tu nombre de usuario para registrarte.';
    expect(detectIntent('No lo tengo')?.action).toBe('registrar_usuario');
    expect(detectIntent('No tengo')?.action).toBe('registrar_usuario');
    expect(detectIntent('No')?.reply).toBe(expected);
    expect(detectIntent('Quiero registrarme')?.action).toBe('registrar_usuario');
    expect(detectIntent('Crear cuenta')?.action).toBe('registrar_usuario');
  });

  it('reconoce cuando el usuario envía sus credenciales', () => {
    expect(detectIntent('mi usuario es ana y mi clave 1234')?.action).toBe(
      'proporcionar_credenciales'
    );
    expect(detectIntent('usuario ana, acceso 1234')?.action).toBe('proporcionar_credenciales');
  });

  it('parseCredentials extrae usuario y acceso', () => {
    expect(parseCredentials('mi usuario es ana y mi clave 1234')).toEqual({
      username: 'ana',
      password: '1234',
    });
    expect(parseCredentials('ana 1234')).toEqual({ username: 'ana', password: '1234' });
    expect(parseCredentials('ana')).toBeNull();
    expect(parseCredentials('cuánto cuesta el pan', { exactTokens: true })).toBeNull();
  });

  it('devuelve null cuando no hay coincidencia', () => {
    expect(detectIntent('cuánto cuesta el pan')).toBeNull();
  });
});
