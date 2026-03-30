import pool from '../config/database.js'

export const queryExecutor = async (query, params = []) => {
    try {
        const [result] = await pool.execute(query, params)
        return result
    } catch (error) {
        console.error('[queryExecutor > queryExecutor]', error.message, { query, params })
        throw error
    }
}