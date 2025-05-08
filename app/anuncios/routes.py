import os, uuid
from flask import Blueprint, request, jsonify, url_for
from werkzeug.utils import secure_filename
from app import db
from app.auth.routes import token_required
from app.models import Anuncio

anuncios_bp = Blueprint('anuncios', __name__)

UPLOAD_FOLDER = os.path.join('static','uploads')
ALLOWED_EXTENSIONS = {'png','jpg','jpeg','gif'}

def allowed_file(fn):
    return '.' in fn and fn.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@anuncios_bp.route('/upload-imagem', methods=['POST'])
@token_required
def upload_imagem(current_user):
    file = request.files.get('imagem')
    if not file or not allowed_file(file.filename):
        return jsonify({'erro': 'Arquivo inválido'}), 400
    safe = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe}"
    file.save(os.path.join('static', 'uploads', unique_name))
    img_url = url_for('static', filename='uploads/' + unique_name)
    return jsonify({'image_url': img_url}), 200

    return '.' in fn and fn.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS

@anuncios_bp.route('/anuncios', methods=['GET'])
@token_required
def list_anuncios(current_user):
    q = Anuncio.query
    if not current_user.is_admin:
        q = q.filter_by(usuario_id=current_user.id)
    res=[]
    for a in q.all():
        d=a.to_dict()
        if d.get('imagem'):
            d['imagem']=url_for('static',filename=f'uploads/{d["imagem"]}')
        res.append(d)
    return jsonify(res)

@anuncios_bp.route('/anuncios', methods=['POST'])
@token_required
def create_anuncio(current_user):
    # Handle JSON payloads (from frontend)
    if request.is_json:
        data = request.get_json()
        titulo = data.get('nome_pet')
        descricao = data.get('descricao', '')
        idade = data.get('idade')
        sexo = data.get('sexo')
        telefone = data.get('telefone_responsavel')
        filename = os.path.basename(data.get('imagem_url', '')) or None
        a = Anuncio(titulo=titulo, descricao=descricao, idade=int(idade), sexo=sexo,
                     telefone='+55'+telefone, imagem=filename, usuario_id=current_user.id)
        db.session.add(a)
        db.session.commit()
        return jsonify(a.to_dict()), 201


    titulo=request.form.get('titulo')
    descricao=request.form.get('descricao')
    idade=request.form.get('idade')
    sexo=request.form.get('sexo')
    telefone=request.form.get('telefone')
    file=request.files.get('imagem')
    fn=None
    if file and allowed_file(file.filename):
        safe=secure_filename(file.filename)
        fn=f"{uuid.uuid4().hex}_{safe}"
        file.save(os.path.join('static','uploads',fn))
    a=Anuncio(titulo= titulo, descricao=descricao,
              idade=int(idade), sexo=sexo, telefone='+55'+telefone,
              imagem=fn, usuario_id=current_user.id)
    db.session.add(a); db.session.commit()
    return jsonify(a.to_dict()),201

@anuncios_bp.route('/anuncios/<int:id>', methods=['PUT'])
@token_required
def update_anuncio(current_user,id):
    a = Anuncio.query.get_or_404(id)
    if a.usuario_id != current_user.id and not current_user.is_admin:
        return jsonify({'message':'Sem permissão'}), 403
    # JSON payload support
    if request.is_json:
        data = request.get_json()
        a.titulo = data.get('nome_pet', a.titulo)
        a.idade = int(data.get('idade', a.idade))
        a.sexo = data.get('sexo', a.sexo)
        tel = data.get('telefone_responsavel')
        if tel:
            a.telefone = '+55' + tel
        filename = os.path.basename(data.get('imagem_url', ''))
        if filename:
            a.imagem = filename
        db.session.commit()
        return jsonify(a.to_dict())
    # Form data handling
    a.titulo = request.form.get('titulo', a.titulo)
    a.descricao = request.form.get('descricao', a.descricao)
    a.idade = int(request.form.get('idade', a.idade))
    a.sexo = request.form.get('sexo', a.sexo)
    a.telefone = '+55' + request.form.get('telefone', a.telefone)
    file = request.files.get('imagem')
    if file and allowed_file(file.filename):
        safe = secure_filename(file.filename)
        fn = f"{uuid.uuid4().hex}_{safe}"
        file.save(os.path.join('static', 'uploads', fn))
        a.imagem = fn
    db.session.commit()
    return jsonify(a.to_dict())
    # Handle JSON payloads (from frontend)
    if request.is_json:
        data = request.get_json()
        a.titulo = data.get('nome_pet', a.titulo)
        a.idade = int(data.get('idade', a.idade))
        a.sexo = data.get('sexo', a.sexo)
        tel = data.get('telefone_responsavel')
        if tel:
            a.telefone = '+55'+tel
        filename = os.path.basename(data.get('imagem_url', ''))
        if filename:
            a.imagem = filename
        db.session.commit()
        return jsonify(a.to_dict())


    a=Anuncio.query.get_or_404(id)
    if a.usuario_id!=current_user.id and not current_user.is_admin:
        return jsonify({'message':'Sem permissão'}),403
    a.titulo=request.form.get('titulo',a.titulo)
    a.descricao=request.form.get('descricao',a.descricao)
    a.idade=int(request.form.get('idade',a.idade))
    a.sexo=request.form.get('sexo',a.sexo)
    a.telefone='+55'+request.form.get('telefone',a.telefone)
    file=request.files.get('imagem')
    if file and allowed_file(file.filename):
        safe=secure_filename(file.filename)
        fn=f"{uuid.uuid4().hex}_{safe}"
        file.save(os.path.join('static','uploads',fn))
        a.imagem=fn
    db.session.commit()
    return jsonify(a.to_dict())

@anuncios_bp.route('/anuncios/<int:id>', methods=['DELETE'])
@token_required
def delete_anuncio(current_user,id):
    a=Anuncio.query.get_or_404(id)
    if a.usuario_id!=current_user.id and not current_user.is_admin:
        return jsonify({'message':'Sem permissão'}),403
    db.session.delete(a); db.session.commit()
    return jsonify({'message':'Anúncio removido'})