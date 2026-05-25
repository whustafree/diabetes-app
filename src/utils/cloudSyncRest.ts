/**
 * Módulo de sincronización alternativo que usa la REST API de Firestore directamente
 * mediante fetch() estándar, en lugar del SDK de Firebase.
 *
 * Esto evita el error "Failed to get document because the client is offline"
 * que ocurre cuando el SDK de Firestore no puede establecer conexión WebSocket/long polling.
 *
 * La REST API usa HTTPS estándar (funciona siempre que el navegador tenga internet)
 * y se autentica con el token ID de Firebase Auth.
 */

import { getAuth } from 'firebase/auth';

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const FIRESTORE_API_BASE = 'https://firestore.googleapis.com/v1';

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Obtiene el projectId desde la app de Firebase ya inicializada.
 * Se obtiene del auth actual (que ya está inicializado cuando se llama a estas funciones).
 */
function getProjectId(): string {
  // Leer de las variables de entorno como fallback
  const fromEnv = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (fromEnv && fromEnv !== 'tu-proyecto') return fromEnv;

  // Intentar obtenerlo del auth currentUser (el proyecto está en el token)
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    // Extraer projectId del tenantId o del providerId — no es confiable
    // Mejor usar variable de entorno
  }

  throw new Error('No se puede determinar el projectId de Firebase. Verifica VITE_FIREBASE_PROJECT_ID.');
}

/**
 * Obtiene el token de autenticación del usuario actual.
 */
async function getIdToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado');
  const token = await user.getIdToken();
  if (!token) throw new Error('No se pudo obtener el token de autenticación');
  return token;
}

/**
 * Construye la ruta del documento en Firestore.
 * Ejemplo: users/{uid}/profile/all
 */
function buildDocPath(uid: string, collectionName: string): string {
  return `users/${uid}/${collectionName}/all`;
}

// ---------------------------------------------------------------------------
// Conversión de formato (Firestore REST API <-> JS)
// ---------------------------------------------------------------------------

/**
 * Convierte un valor JS al formato fields de Firestore REST API.
 * Soporta: string, number, boolean, null, arrays, objetos planos.
 */
function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };

  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value) && Math.abs(value) < 2 ** 53) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(v => toFirestoreValue(v)),
      },
    };
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }

  return { stringValue: String(value) };
}

/**
 * Convierte un valor del formato fields de Firestore REST API a JS.
 */
function fromFirestoreValue(value: Record<string, unknown>): unknown {
  if ('nullValue' in value && value.nullValue === null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) {
    const str = value.integerValue as string;
    const num = Number(str);
    return Number.isSafeInteger(num) ? num : str;
  }
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) {
    const arr = (value.arrayValue as { values?: Record<string, unknown>[] }).values || [];
    return arr.map(v => fromFirestoreValue(v));
  }
  if ('mapValue' in value) {
    const fields = (value.mapValue as { fields?: Record<string, unknown> }).fields || {};
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      result[k] = fromFirestoreValue(v as Record<string, unknown>);
    }
    return result;
  }
  return value;
}

/**
 * Convierte la respuesta de un documento Firestore (contenido de 'fields') a un objeto JS plano.
 */
function documentToObject(fields: Record<string, unknown>): unknown {
  return fromFirestoreValue({ mapValue: { fields } });
}

/**
 * Convierte un objeto JS al formato fields de Firestore REST API.
 */
function objectToDocument(obj: Record<string, unknown>): Record<string, unknown> {
  const mv = toFirestoreValue(obj) as { mapValue?: { fields: Record<string, unknown> } };
  return mv.mapValue?.fields ?? {};
}

// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------

export interface CloudData<T> {
  items: T[];
  updatedAt: string;
}

/**
 * Guarda datos usando la REST API de Firestore.
 * Retorna true si se guardó correctamente, false en caso de error.
 */
export async function saveToCloudViaRest<T>(
  uid: string,
  collectionName: string,
  items: T[]
): Promise<boolean> {
  try {
    const projectId = getProjectId();
    const token = await getIdToken();
    const docPath = buildDocPath(uid, collectionName);

    const data: CloudData<T> = {
      items: JSON.parse(JSON.stringify(items)),
      updatedAt: new Date().toISOString(),
    };

    const url = `${FIRESTORE_API_BASE}/projects/${projectId}/databases/(default)/documents/${docPath}`;

    const body = {
      fields: objectToDocument(data as unknown as Record<string, unknown>),
    };

    // Intentar actualizar documento existente (PATCH)
    const updateUrl = `${url}?updateMask.fieldPaths=items&updateMask.fieldPaths=updatedAt`;
    let res = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Si el documento no existe (404), crearlo con POST
    if (res.status === 404) {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      console.error(`[REST] Error guardando ${collectionName}: ${res.status} ${errText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[REST] Error guardando ${collectionName} en la nube:`, err);
    return false;
  }
}

/**
 * Carga datos usando la REST API de Firestore.
 * Retorna los datos o null si no existen / hay error.
 */
export async function loadFromCloudViaRest<T>(
  uid: string,
  collectionName: string
): Promise<CloudData<T> | null> {
  try {
    const projectId = getProjectId();
    const token = await getIdToken();
    const docPath = buildDocPath(uid, collectionName);

    const url = `${FIRESTORE_API_BASE}/projects/${projectId}/databases/(default)/documents/${docPath}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`Firestore REST API error ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const fields = json.fields as Record<string, unknown>;
    if (!fields) return null;

    const obj = documentToObject(fields) as CloudData<T> | null;
    if (!obj || !obj.items) return null;

    return obj;
  } catch (err) {
    console.error(`[REST] Error cargando ${collectionName} desde la nube:`, err);
    throw err; // Propagar para que el llamador lo maneje
  }
}
