import os
import uuid
from flask import Blueprint, request, jsonify, url_for, current_app
from werkzeug.utils import secure_filename
from app import db
from app.auth.routes import token_required
from app.models import Anuncio

anuncios_bp = Blueprint('anuncios', __name__)

# configurações de upload
UPLOAD_FOLDER = os.path.join(current_app.root_path, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@anuncios_bp.route('/upload-imagem', methods=['POST'])
@token_required
def upload_imagem(current_user):
    file = request.files.get('imagem')
    if not file or not allowed_file(file.filename):
        return jsonify({'erro': 'Arquivo inválido'}), 400

    safe_name = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file.save(os.path.join(UPLOAD_FOLDER, unique_name))

    img_url = url_for('static', filename=f'uploads/{unique_name}')
    return jsonify({'image_url': img_url}), 200

@anuncios_bp.route('/anuncios', methods=['GET'])
@token_required
def list_anuncios(current_user):
    query = Anuncio.query
    if not current_user.is_admin:
        query = query.filter_by(usuario_id=current_user.id)

    resultados = []
    for a in query.all():
        data = a.to_dict()
        if data.get('imagem'):
            data['imagem'] = url_for('static', filename=f'uploads/{data["imagem"]}')
        resultados.append(data)

    return jsonify(resultados), 200

@anuncios_bp.route('/anuncios', methods=['POST'])
@token_required
def create_anuncio(current_user):
    # JSON payload
    if request.is_json:
        data = request.get_json()
        telefone_raw = data.get('telefone_responsavel', '').strip()
        anuncio = Anuncio(
            titulo=data.get('nome_pet'),
            descricao=data.get('descricao', ''),
            idade=int(data.get('idade', 0)),
            sexo=data.get('sexo'),
            telefone=f'+55{telefone_raw}' if telefone_raw else '',
            imagem=os.path.basename(data.get('imagem_url', '')) or None,
            usuario_id=current_user.id
        )
        db.session.add(anuncio)
        db.session.commit()

        resp = anuncio.to_dict()
        if resp.get('imagem'):
            resp['imagem'] = url_for('static', filename=f'uploads/{resp["imagem"]}')
        return jsonify(resp), 201

    # form-data (multipart)
    telefone_raw = request.form.get('telefone', '').strip()
    filename = None
    file = request.files.get('imagem')
    if file and allowed_file(file.filename):
        safe_name = secure_filename(file.filename)
        filename = f"{uuid.uuid4().hex}_{safe_name}"
        file.save(os.path.join(UPLOAD_FOLDER, filename))

    anuncio = Anuncio(
        titulo=request.form.get('titulo'),
        descricao=request.form.get('descricao', ''),
        idade=int(request.form.get('idade', 0)),
        sexo=request.form.get('sexo'),
        telefone=f'+55{telefone_raw}' if telefone_raw else '',
        imagem=filename,
        usuario_id=current_user.id
    )
    db.session.add(anuncio)
    db.session.commit()

    resp = anuncio.to_dict()
    if resp.get('imagem'):
        resp['imagem'] = url_for('static', filename=f'uploads/{resp["imagem"]}')
    return jsonify(resp), 201

@anuncios_bp.route('/anuncios/<int:anuncio_id>', methods=['PUT'])
@token_required
def update_anuncio(current_user, anuncio_id):
    a = Anuncio.query.get_or_404(anuncio_id)
    if a.usuario_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Sem permissão'}), 403

    # JSON payload
    if request.is_json:
        data = request.get_json()
        a.titulo = data.get('nome_pet', a.titulo)
        a.descricao = data.get('descricao', a.descricao)
        a.idade = int(data.get('idade', a.idade))
        a.sexo = data.get('sexo', a.sexo)
        tel_raw = data.get('telefone_responsavel', '').strip()
        if tel_raw:
            a.telefone = f'+55{tel_raw}'
        filename = os.path.basename(data.get('imagem_url', ''))
        if filename:
            a.imagem = filename

    else:
        # form-data
        a.titulo = request.form.get('titulo', a.titulo)
        a.descricao = request.form.get('descricao', a.descricao)
        a.idade = int(request.form.get('idade', a.idade))
        a.sexo = request.form.get('sexo', a.sexo)
        tel_raw = request.form.get('telefone', '').strip()
        if tel_raw:
            a.telefone = f'+55{tel_raw}'
        file = request.files.get('imagem')
        if file and allowed_file(file.filename):
            safe_name = secure_filename(file.filename)
            filename = f"{uuid.uuid4().hex}_{safe_name}"
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            a.imagem = filename

    db.session.commit()
    resp = a.to_dict()
    if resp.get('imagem'):
        resp['imagem'] = url_for('static', filename=f'uploads/{resp["imagem"]}')
    return jsonify(resp), 200

@anuncios_bp.route('/anuncios/<int:anuncio_id>', methods=['DELETE'])
@token_required
def delete_anuncio(current_user, anuncio_id):
    a = Anuncio.query.get_or_404(anuncio_id)
    if a.usuario_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Sem permissão'}), 403

    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Anúncio removido'}), 200
