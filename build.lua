local djot = require 'djot'

local function load_template(path)
    local f = io.open('templates/' .. path, 'r')
    local template = f:read('a')
    f:close()
    return template
end

local base_template = load_template('base.html')
local post_template = load_template('post.html')

local tmpfile_path = os.tmpname()

local function colorize(text, lang)
    local file = io.popen(string.format('pygmentize -f html -l %s -o %s', lang, tmpfile_path), 'w')
    file:write(text)
    file:close()

    local tmpfile = io.open(tmpfile_path, 'r')
    local html = tmpfile:read('a')
    tmpfile:close()
    return html
end

-- the queue starts with any page roots
local queue = {
    '/index',
    '/404',
}

local visited = { ['/'] = true }

-- start at the root and build the website by
while #queue > 0 do
    local path = table.remove(queue, #queue)
    if path:match('%.%a+$') then
        goto continue
    end
    if path:sub(#path, #path) == '/' then
        path = path:sub(1, #path - 1)
    end

    print('\t' .. path)
    local file, err = io.open('pages' .. path .. '.dj', 'r')
    if file == nil then
        print('Error: unable to find file "pages' .. path .. '.dj' .. '"')
        return
    end

    local contents = file:read('a') or ''
    file:close()

    local doc = djot.parse(contents)

    local data = {}
    local filters = {{
        link = function(element)
            -- internal links
            if element.destination:sub(1, 1) == '/' and not element.destination:match('#.*$') then
                if visited[element.destination] ~= true then
                    visited[element.destination] = true
                    table.insert(queue, element.destination)
                end

                element.destination = element.destination
            end
        end,
        code_block = function(element)
            element.tag = 'raw_block'
            element.format = 'html'
            element.text = colorize(element.text, element.lang)
        end,
        raw_block = function(element)
            if element.format == 'metadata' then
                for line in element.text:gmatch('[^\n]+') do
                    local key, value = line:match('(%w+) *= *(.+)$')
                    data[key] = value
                end
            end
        end,
        section = function(element)
            -- for k, v in pairs(element.children[1]) do print(k, v) end
            element.attr.id = element.attr.id:lower()

            local heading = element.children[1]
            local text = heading.children[1].text

            heading.tag = 'raw_block'
            heading.format = 'html'
            heading.text = string.format('<h%d><a class="header-anchor" href="#%s">#</a> %s</h%d>', heading.level, element.attr.id, text, heading.level)
        end,
        div = function(element)
            if element.attr.class == 'callout' then
                element.attr.role = 'note'
            end
        end
    }}
    djot.filter.apply_filter(doc, filters)

    data.contents = djot.render_html(doc)
    data.title = data.title or "Nathan Craddock"
    data.description = data.description or data.title

    local rendered = base_template

    if path:match('^/blog') then
        rendered = rendered:gsub('::contents::', post_template)
    end
    rendered = rendered:gsub('::(%w+)::', data)

    local base = string.match(path, '(.*/)(.*)')
    if base == '/' then
        os.execute(string.format('mkdir -p build/'))
    else
        os.execute(string.format('mkdir -p build/%s', path))
    end

    if path == '/index' then
        path = ''
    end
    local out, err = io.open('build/' .. (data.dest or (path .. '/index.html')), 'w')
    if out == nil then
        print(err)
        return
    end
    out:write(rendered)
    out:close()

    ::continue::
end

os.remove(tmpfile_path)

-- copy static files
os.execute('cp -r static/ build/')

local count = 0
for page in pairs(visited) do count = count + 1 end
print(string.format('Output %d pages', count))
