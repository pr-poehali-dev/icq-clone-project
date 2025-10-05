"""
Business: Send, receive and manage chat messages
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with messages or success status
"""

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            user_id = params.get('user_id')
            contact_id = params.get('contact_id')
            
            if not user_id or not contact_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id and contact_id required'})
                }
            
            cur.execute("""
                SELECT m.id, m.sender_id, m.receiver_id, m.content, m.file_url, m.file_name, 
                       m.is_read, m.created_at, u.username, u.avatar_url, m.voice_url, m.voice_duration
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE (m.sender_id = %s AND m.receiver_id = %s) 
                   OR (m.sender_id = %s AND m.receiver_id = %s)
                ORDER BY m.created_at ASC
            """, (user_id, contact_id, contact_id, user_id))
            
            messages = []
            for row in cur.fetchall():
                messages.append({
                    'id': row[0],
                    'sender_id': row[1],
                    'receiver_id': row[2],
                    'content': row[3],
                    'file_url': row[4],
                    'file_name': row[5],
                    'is_read': row[6],
                    'created_at': row[7].isoformat(),
                    'sender_name': row[8],
                    'sender_avatar': row[9],
                    'voice_url': row[10] if len(row) > 10 else None,
                    'voice_duration': row[11] if len(row) > 11 else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'send')
            
            if action == 'send':
                sender_id = body_data.get('sender_id')
                receiver_id = body_data.get('receiver_id')
                content = body_data.get('content', '')
                file_url = body_data.get('file_url')
                file_name = body_data.get('file_name')
                voice_url = body_data.get('voice_url')
                voice_duration = body_data.get('voice_duration')
                
                if not sender_id or not receiver_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'sender_id and receiver_id required'})
                    }
                
                cur.execute("""
                    INSERT INTO messages (sender_id, receiver_id, content, file_url, file_name, voice_url, voice_duration)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (sender_id, receiver_id, content, file_url, file_name, voice_url, voice_duration))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': result[0],
                        'created_at': result[1].isoformat()
                    })
                }
            
            elif action == 'mark_read':
                message_ids = body_data.get('message_ids', [])
                if message_ids:
                    cur.execute(
                        "UPDATE messages SET is_read = TRUE WHERE id = ANY(%s)",
                        (message_ids,)
                    )
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()