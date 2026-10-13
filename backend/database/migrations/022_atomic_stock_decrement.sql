-- Migration: 022_atomic_stock_decrement.sql
-- Purpose: Fix race condition in stock decrement by using atomic SQL function
-- Date: 2026-08-11

-- Crear función atómica para decrementar stock
CREATE OR REPLACE FUNCTION decrement_order_stock(order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_success BOOLEAN := TRUE;
BEGIN
    -- Obtener la orden con LOCK para evitar race conditions
    SELECT * INTO v_order FROM ordenes WHERE id_orden = order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada: %', order_id;
    END IF;
    
    -- Iterar sobre cada item de la orden y decrementar stock atomicamente
    FOR v_item IN 
        SELECT id_producto, cantidad FROM orden_items WHERE id_orden = order_id
    LOOP
        -- UPDATE atómico: solo decrementa si hay stock suficiente
        UPDATE productos
        SET stock = stock - v_item.cantidad
        WHERE id_producto = v_item.id_producto 
          AND stock >= v_item.cantidad;
        
        -- Verificar que la actualización fue exitosa
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Stock insuficiente para producto %', v_item.id_producto;
        END IF;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error decrementando stock para orden %: %', order_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Comentario de seguridad
COMMENT ON FUNCTION decrement_order_stock(UUID) IS 
    'Decrementa stock de manera atómica para prevenir race conditions. 
     Usa transacciones y locks para garantizar consistencia.';
