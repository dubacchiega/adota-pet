require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql2 = require('mysql2/promise');

async function migrate() {
  const connection = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'adota_pet',
    user: process.env.DB_USER || 'adota_user',
    password: process.env.DB_PASSWORD || 'adota_pass',
    multipleStatements: true,
  });

  console.log('🐾 Iniciando migração do banco de dados...');

  try {
    // Tabela de usuários
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        nome        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL UNIQUE,
        senha_hash  VARCHAR(255) NOT NULL,
        telefone    VARCHAR(20),
        cidade      VARCHAR(100),
        tipo        ENUM('adotante', 'doador') NOT NULL DEFAULT 'adotante',
        criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✅ Tabela usuarios criada/verificada.');

    // Tabela de animais
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS animais (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id   INT NOT NULL,
        nome         VARCHAR(100) NOT NULL,
        especie      ENUM('cachorro', 'gato', 'outro') NOT NULL,
        raca         VARCHAR(100),
        idade_anos   TINYINT UNSIGNED,
        sexo         ENUM('macho', 'femea') NOT NULL,
        porte        ENUM('pequeno', 'medio', 'grande'),
        descricao    TEXT,
        vacinado     TINYINT(1) NOT NULL DEFAULT 0,
        castrado     TINYINT(1) NOT NULL DEFAULT 0,
        foto_url     VARCHAR(255),
        status       ENUM('disponivel', 'em_processo', 'adotado') NOT NULL DEFAULT 'disponivel',
        criado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✅ Tabela animais criada/verificada.');

    // Tabela de solicitações de adoção
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS solicitacoes (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        animal_id       INT NOT NULL,
        adotante_id     INT NOT NULL,
        mensagem        TEXT,
        tem_outros_pets TINYINT(1) NOT NULL DEFAULT 0,
        tem_criancas    TINYINT(1) NOT NULL DEFAULT 0,
        tipo_moradia    ENUM('casa_com_quintal', 'casa_sem_quintal', 'apartamento') NOT NULL,
        status          ENUM('pendente', 'aprovada', 'recusada') NOT NULL DEFAULT 'pendente',
        criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (animal_id)   REFERENCES animais(id)   ON DELETE CASCADE,
        FOREIGN KEY (adotante_id) REFERENCES usuarios(id)  ON DELETE CASCADE,
        UNIQUE KEY unico_pedido (animal_id, adotante_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✅ Tabela solicitacoes criada/verificada.');

    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
