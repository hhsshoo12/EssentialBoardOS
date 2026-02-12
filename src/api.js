const API_KEY = 'ebos_secret_key_1234' // This should match server/.env

export async function ebosFetch(url, options = {}) {
    const defaultHeaders = {
        'x-api-key': API_KEY,
    }

    const mergedOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    }

    const response = await fetch(url, mergedOptions)

    if (response.status === 401) {
        console.error('EBOS API Auth Error: Check if API_KEY matches server/.env')
    }

    return response
}
