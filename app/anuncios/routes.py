import os
import uuid
from flask import Blueprint, request, jsonify, url_for
from werkzeug.utils import secure_filename
from app import db
from app.auth.routes import token_required
from app.models import Anuncio

anuncios_bp = Blueprint('anuncios', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@anuncios_bp.route('/upload-imagem', methods=['POST'])
@token_required
def upload_imagem(current_user):
    file = request.files.get('imagem')
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Arquivo inválido'}), 400

    safe = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe}"
    save_path = os.path.join('static', 'uploads', unique_name)
    file.save(save_path)

    img_url = url_for('static', filename=f'uploads/{unique_name}', _external=True)
    return jsonify({'image_url': img_url}), 200

@anuncios_bp.route('/anuncios', methods=['GET'])
@token_required
def list_anuncios(current_user):
    query = Anuncio.query
    if not current_user.is_admin:
        query = query.filter_by(usuario_id=current_user.id)

    resultados = []
    for a in query.all():
        d = a.to_dict()
        if d.get('imagem'):
            d['imagem'] = url_for('static', filename=f'uploads/{d["imagem"]}', _external=True)
        resultados.append(d)

    return jsonify(resultados), 200

@anuncios_bp.route('/anuncios', methods=['POST'])
@token_required
def create_anuncio(current_user):
    if request.is_json:
        data = request.get_json()
        titulo = data.get('titulo') or data.get('nome_pet')
        descricao = data.get('descricao', '')
        idade = data.get('idade')
        sexo = data.get('sexo')
        telefone = data.get('telefone_responsavel') or data.get('telefone', '')
        imagem_url = data.get('imagem_url', '')
        filename = os.path.basename(imagem_url) if imagem_url else None

        a = Anuncio(
            titulo=titulo,
            descricao=descricao,
            idade=int(idade),
            sexo=sexo,
            telefone=f'+55{telefone}',
            imagem=filename,
            usuario_id=current_user.id
        )
        db.session.add(a)
        db.session.commit()
        return jsonify(a.to_dict()), 201

    # fallback form-data
    titulo   = request.form.get('titulo')
    descricao= request.form.get('descricao')
    idade    = request.form.get('idade')
    sexo     = request.form.get('sexo')
    telefone = request.form.get('telefone', '')
    file     = request.files.get('imagem')
    filename = None

    if file and allowed_file(file.filename):
        safe     = secure_filename(file.filename)
        filename = f"{uuid.uuid4().hex}_{safe}"
        file.save(os.path.join('static', 'uploads', filename))

    a = Anuncio(
        titulo=titulo,
        descricao=descricao,
        idade=int(idade),
        sexo=sexo,
        telefone=f'+55{telefone}',
        imagem=filename,
        usuario_id=current_user.id
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201

@anuncios_bp.route('/anuncios/<int:id>', methods=['PUT'])
@token_required
def update_anuncio(current_user, id):
    a = Anuncio.query.get_or_404(id)
    if a.usuario_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Sem permissão'}), 403

    if request.is_json:
        data = request.get_json()
        a.titulo = data.get('titulo', a.titulo)
        a.idade  = int(data.get('idade', a.idade))
        a.sexo   = data.get('sexo', a.sexo)
        tel       = data.get('telefone_responsavel') or data.get('telefone')
        if tel:
            a.telefone = f'+55{tel}'
        img_url   = data.get('imagem_url', '')
        filename  = os.path.basename(img_url) if img_url else None
        if filename:
            a.imagem = filename
        db.session.commit()
        return jsonify(a.to_dict()), 200

    a.titulo   = request.form.get('titulo', a.titulo)
    a.descricao= request.form.get('descricao', a.descricao)
    a.idade    = int(request.form.get('idade', a.idade))
    a.sexo     = request.form.get('sexo', a.sexo)
    tel        = request.form.get('telefone')
    if tel:
        a.telefone = f'+55{tel}'
    file       = request.files.get('imagem')
    if file and allowed_file(file.filename):
        safe     = secure_filename(file.filename)
        filename = f"{uuid.uuid4().hex}_{safe}"
        file.save(os.path.join('static', 'uploads', filename))
        a.imagem = filename
    db.session.commit()
    return jsonify(a.to_dict()), 200

@anuncios_bp.route('/anuncios/<int:id>', methods=['DELETE'])
@token_required
def delete_anuncio(current_user, id):
    a = Anuncio.query.get_or_404(id)
    if a.usuario_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Sem permissão'}), 403
    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Anúncio removido'}), 200
