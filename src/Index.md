## Rodando o ambiente
> Modo stealth

---

### O problema:
Executar o projeto **site**, o projeto **admin**, e fazer operações
de **git** com apenas um terminal

### Solução
* Utilizar algum [Terminal Multiplexer](https://www.slant.co/topics/4018/~terminal-multiplexers) ao invés do git bash
* Abrir vários git bash
* Ou **rodar os scripts dentro dos containers docker**

---

### Conversando com as instâncias
[Docker](https://www.docker.com/) permite configurar as maquinas com o [Docker Compose](https://docs.docker.com/compose/)
e, com uma linguagem de terminal, permite conversar com estas maquinas.

A config geralmente fica no arquivo `/docker-compose.yml` na raiz do projeto:

```
services:
  app:
    image: registry.i9xp.com.br:8082/docker/php-apache:${DOCKER_TAG}
    container_name: mondelez20-admin
    volumes:
      - .:/var/www/html/app
    env_file:
      - .env
    ports:
      - "8081:80"
      - "30204:443"
      - "8080:8080"
```

Foco no nó `services.app` aqui, "app" é o nome do container para o **docker-compose**.

> Utilizando `docker` no terminal, por exemplo `docker ps`, as referências são pelo
> nome do container (no caso mondelez20-admin), mas para o docker-compose, as
> referências utilizam esse arquivo de configuração, então ele necessita do contexto
> (estar na pasta /admin) e do nome "app".

#### Comandos

Para subir o container, e executar toda a máquina com php, apache etc, o comando é

```docker-compose up```.

Pra subir o container em modo **detached** (nao inutiliza o terminal), o comando é
o mesmo, com a flag "-d":

```docker-compose up -d```

Pra ver os containers em execução (ps de processes):

```docker ps```

Docker ps espera que o terminal esteja numa tela ultra wide, então sugiro customizar a tabela dele:

```docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}'```

Fica mais bonitinho (exemplo):

```
CONTAINER ID        NAMES                      STATUS              PORTS
6a4cc3e76214        mondelez20-admin           Up 2 hours          0.0.0.0:8080->8080/tcp, 0.0.0.0:8081->80/tcp, 0.0.0.0:30204->443/tcp
607af022b269        mondelez20-site            Up 2 hours          0.0.0.0:30201->80/tcp, 0.0.0.0:30202->443/tcp
e1ba531ec9f1        site_phpmemcachedadmin_1   Up 2 hours          0.0.0.0:30205->80/tcp
c177d5930205        site_memcached_1           Up 2 hours          0.0.0.0:32768->11211/tcp
662bb42d4035        mondelez20-report          Up 2 hours          0.0.0.0:8082->80/tcp, 0.0.0.0:30206->443/tcp
```

Outro detalhe legal é relembrar as aulas de infra de redes e ver que cada container
tem uma porta externa (30204) apontando para uma interna (443).

O **NPM**, por outro lado, nos oferece um incrível contexto, permitindo chamar arquivos
que estão instalados no node_modules, por meio dos **scripts**, declarados no package.json:

```
"scripts": {
    "vue-install": "cd ./front && npm install",
    "dev": "cd ./front && npm run local-serve",
    "build": "cd ./front && npm run local-build",
    "prod": "cd ./front && npm run build"
}
```
> "npm start" e "npm build", pra qualquer outro, "npm run NOME". (ex.: npm run dev)

O "npm start" ou seus equivalentes "npm run dev", "npm run watch", "npm run dev" mais comuns,
são wrappers pra algum bundler, como [Webpack](https://webpack.js.org/) ou [Gulp](https://gulpjs.com/docs/en/api/symlink/#symlink),
projeto responsável por ler todos os .js do sistema, juntar, minificar, fazer [polyfills](https://developer.mozilla.org/pt-BR/docs/Glossario/Polyfill), [observar mudanças nos arquivos](https://thisdavej.com/how-to-watch-for-files-changes-in-node-js/) e as vezes [atualizar o browser](https://webpack.js.org/concepts/hot-module-replacement/) automaticamente.

É o webpack que lida com os "imports".

O porém do webpack é que ele não tem uma opção "detached" como o docker-compose up tem.

Além disso, npm start inicia tarefas que iniciam tarefas, então todos os meios de pipe
do terminal nao conseguem _detachar_ o suficiente pra deixar o terminal livre.

#### Entrando no docker

O docker também abre uma interface para "entrar" no terminal interno do container,
e enviar comandos por dentro, pra dentro.

`docker exec -it mondelez20-admin bash`

A sintaxe real é "docker exec -i -t CONTAINER_NAME COMANDO", que vai _attachar_ o terminal
ao COMANDO rodando dentro do CONTAINER_NAME, ou seja te joga pra dentro da vm.

> Como o git bash roda em cima do windows, é necessário rodar algo tipo "winpty docker exec ..." porque razoes

Docker permite também rodar comandos sem entrar na máquina:

`docker-compose exec -d NOME_SERVICO COMANDO`

Bash permite ser inicializado já com um comando registrado, ao invés de subir um terminal:

`bash -c "cd / && rm -rf"`

O seguinte comando é tipo:

* docker, execute dentro de **"app"** o comando:
    * bash, execute chamando o npm:
        * npm, execute o script "dev"

`winpty docker-compose exec -d app bash -c "npm run dev"`

E tudo detached do seu terminal.

### Problema

Como eu sei se rodou? 

Ótima feature, de executar o npm dentro do docker, mas, como eu sei se houve algum problema?
Npm é bem verboso sobre erros de import, de packages não instalados etc

Em primeira instância posso simplesmente entrar na máquina, com
`winpty docker exec -it mondelez20-admin bash`, e estando dentro dela, ver os processos com `ps aux`:

```
$ winpty docker exec -it mondelez20-admin bash
[root@6a4cc3e76214 app]# ps aux
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1  11364  2404 ?        Ss   12:06   0:00 bash /entrypoint.sh
root         6  0.0  0.1  11364  2412 ?        S    12:06   0:00 /bin/sh /usr/sbin/apachectl -D FOREGROUND
root         9  0.0  1.1 281988 24212 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      10  0.0  0.9 284852 19820 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      11  0.0  0.5 282252 11680 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      12  0.0  1.0 286664 21456 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      13  0.0  1.0 286828 21320 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      14  0.0  0.9 284584 19408 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      15  0.0  0.5 282252 11696 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      16  0.0  0.9 285104 19888 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
apache      17  0.0  0.9 284584 19416 ?        S    12:06   0:00 /usr/sbin/httpd -D FOREGROUND
root       117  0.0  0.1  11364  2428 pts/0    Ss+  12:44   0:00 bash -c cd front && npm run serve > /proc/1/fd/1
root       123  0.0  1.8 1047860 37132 pts/0   Sl+  12:44   0:00 npm
root       132  0.0  0.1  11368  2492 pts/0    S+   12:44   0:00 /bin/sh /var/www/html/app/front/node_modules/.bin/vue-cli-se
root       138  0.6 13.7 1451296 281028 pts/0  Sl+  12:44   0:38 node /var/www/html/app/front/node_modules/.bin/../@vue/cli-s
apache     149  0.0  0.9 284584 19448 ?        S    12:48   0:00 /usr/sbin/httpd -D FOREGROUND
apache     150  0.0  0.5 282252 11640 ?        S    12:48   0:00 /usr/sbin/httpd -D FOREGROUND
apache     151  0.0  0.5 282252 11628 ?        S    12:48   0:00 /usr/sbin/httpd -D FOREGROUND
root       152  0.2  0.1 108356  3040 pts/1    Ss   14:28   0:00 bash
root       167  0.0  0.1 110256  2312 pts/1    R+   14:29   0:00 ps aux
[root@6a4cc3e76214 app]#
```

Blz da pra ver que tem um chamado "npm", então pra parar ele é só pegar o PID e:

```kill 123```

Depois sair da VM e voltar pro meu terminal padrão com `exit`.

Mas essencialmente não é possível ver log nenhum do npm em si.

Felizmente

O docker permite ver os logs da máquina, com o comando

`docker logs mondelez20-admin`

Ou _attachar_ o terminal atual ao fluxo de logs com

`docker logs -ft mondelez20-admin`

> lembrando que o nome do container é o nome que "docker ps" mostra

Felizmente² o docker popula esse log com tudo que aparece na **saída padrão do terminal virtual 1**.

Repare que no output de `ps aux` tem um "TTY" que mostra "pts/0" e "pts/1".

No unix, um processo pode jogar toda sua verbosidade em um terminal virtual, que
pode ser acessado como se fosse um arquivo, no caminho absoluto

`/proc/PID/fd/NUM`

aonde:
* **PID** é o id do processo
* **NUM** é o input padrão (1 para normal e 2 para erro, mas em tese arbitrário)

[https://lists.debian.org/debian-user/2013/02/msg00626.html](https://lists.debian.org/debian-user/2013/02/msg00626.html)

Então, se:
* Abrir um terminal, conectar ao fluxo de logs de um container
* Abrir outro terminal, entrar no container
* Executar `echo "Bolota" > /proc/1/fd/1`

Deve aparecer no outro terminal o output do echo: "Bolota".

> O ">" eh tipo um pipe, manda o output da esquerda pro caminho físico da direita, tipo echo "x" > a.txt cria o arquivo a.txt com o conteudo "x".

> Diferente do "|" que manda o output da esquerda como input do comando da direita, tipo ls | echo, manda o resultado de ls pra echo (da na mesma).

### Comando final

Pra chamar o npm dentro do docker, jogando seus logs pro log padrão do docker, permitindo visualizar quando necessário, o comando é

`winpty docker-compose exec -d app bash -c "npm run dev > /proc/1/fd/1"`

No caso do admin, é um pouco diferente porque tem que rodar o package.json da pasta front/:

`winpty docker-compose exec -d app bash -c "cd front && npm run serve > /proc/1/fd/1"`

E pra ver os logs:

`docker logs mondelez20-admin`

### Considerações

Vai dar erro.

Lendo o npm da pra ver que o módulo que compila SASS tem que ser reconstruído, e o Vue tem que ser instalado e tals.

* [build-fails-npm-rebuild-node-sass-force](https://stackoverflow.com/questions/53125291/build-fails-npm-rebuild-node-sass-force)
* [vue install](https://br.vuejs.org/v2/guide/installation.html)

Com o conhecimento de entrar na vm e rodar comandos, é facil entrar na maquina e instalar as coisas.

Lembrando que `npm install` altera o arquivo `package-lock.json` e creio que nós não gostamos de versionar isso no nosso gitflow,
porque o processo de deploy deve reinstalar as coisas, então após qualquer instalação, rode

`git checkout -- package-lock.json`

Lembrando também que existem outras soluções pra quem gosta de um monte de log, como tmux e tal.

---

### .bashrc

Segue meu bashrc pra auxiliar

```
alias git-fetch-all="echo 'Fetching all'; for i in */.git; do ( echo \$i; cd \$i/..; git fetch -vp; echo ''); done"
alias git-pull-all="echo 'Pulling all'; for i in */.git; do ( echo \$i; cd \$i/..; git pull; echo ''); done"
alias dup-all="echo 'Upping all'; for i in */docker-compose.*; do ( cd ./\$(echo \$i | sed 's/docker-compose..*//g'); echo ''; pwd; docker-compose up -d; ); done"
alias dstop-all="docker stop \$(docker ps -q)"
alias dps="docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}'"
alias my-commands="alias | sed -E 's/alias ([^=]*)=.*/\1/'"
alias gbs="git-branches"
```

[anibo BashRC](https://gist.github.com/annibal/736f8814343abc3ee211c501e8720f81)