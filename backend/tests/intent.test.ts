import { describe, expect, it } from 'vitest';

import { detectIntent } from '../src/services/intent.js';

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

  it('devuelve null cuando no hay coincidencia', () => {
    expect(detectIntent('cuánto cuesta el pan')).toBeNull();
  });
});
