$('#btn_search').click(function (e) {

    var text = document.getElementById('txt_search').value;
    // window.location.href = getBlockchainUrl(text);

    function GetSearchBlockbyHeight() {

        var block, xhrGetSearchBlockbyHeight;
        if (xhrGetSearchBlockbyHeight) xhrGetSearchBlockbyHeight.abort();

        xhrGetSearchBlockbyHeight = $.ajax({
            url: api_blockexplorer + '/json_rpc',
            method: "POST",
            data: JSON.stringify({
                jsonrpc: "2.0",
                id: "blockbyheight",
                method: "getblockheaderbyheight",
                params: {
                    height: parseInt(text)
                }
            }),
            dataType: 'json',
            cache: 'false',
            success: function (data) {
                block = data.result.block_header;
                window.location.href = getBlockchainUrl(block.hash);
            }
        });
    }

    function GetSearchBlock() {
        var block, xhrGetSearchBlock;
        if (xhrGetSearchBlock) xhrGetSearchBlock.abort();
        xhrGetSearchBlock = $.ajax({
            url: api_blockexplorer + '/json_rpc',
            method: "POST",
            data: JSON.stringify({
                jsonrpc: "2.0",
                id: "GetSearchBlock",
                method: "f_block_json",
                params: {
                    hash: text // document.getElementById('txt_search').value // $('#txt_search').attr('value')
                }
            }),
            dataType: 'json',
            cache: 'false',
            success: function (data) {
                if (data.result) {
                    block = data.result.block;
                    // window.location.href = getBlockchainUrl(text);
                    window.location.href = getBlockchainUrl(block.hash);
                } else if (data.error) {
                    window.location.href = transactionExplorer.replace('{id}', text);
                }
            }
        });
    }

    if (text.length < 64) {
        GetSearchBlockbyHeight();
    }
    if (text.length == 64) {
        GetSearchBlock();
    }

    e.preventDefault();

});

$('#txt_search').keyup(function (e) {
    if (e.keyCode === 13)
        $('#btn_search').click();
});

currentPage = {
    destroy: function () {
        if (xhrGetBlocks) xhrGetBlocks.abort();
    },
    init: function () {},
    update: function () {
        updateText('networkLastReward', lastStats.network.height.toString());
        updateText('networkHashrate', getReadableHashRateString(lastStats.network.difficulty / lastStats.config.coinDifficultyTarget) + '/sec');
        updateText('networkDifficulty', lastStats.network.difficulty.toString());
        renderInitialBlocks();
    }
};

var xhrGetBlocks;
$('#loadMoreBlocks').click(function () {
    if (xhrGetBlocks) xhrGetBlocks.abort();
    xhrGetBlocks = $.ajax({
        url: api_blockexplorer + '/json_rpc',
        method: "POST",
        data: JSON.stringify({
            jsonrpc: "2.0",
            id: "test",
            method: "f_blocks_list_json",
            params: {
                height: $('#blocks_rows').children().last().data('height')
            }
        }),
        dataType: 'json',
        cache: 'false',
        success: function (data) {
            renderBlocks(data.result.blocks);
        }
    });
});

function renderInitialBlocks() {
    if (xhrGetBlocks) xhrGetBlocks.abort();
    xhrGetBlocks = $.ajax({
        url: api_blockexplorer + '/json_rpc',
        method: "POST",
        data: JSON.stringify({
            jsonrpc: "2.0",
            id: "test",
            method: "f_blocks_list_json",
            params: {
                height: lastStats.network.height
            }
        }),
        dataType: 'json',
        cache: 'false',
        success: function (data) {
            renderBlocks(data.result.blocks);
        }
    });
};


function parseBlock(height, serializedBlock) {
    var parts = serializedBlock.split(':');
    var block = {
        height: parseInt(height),
        hash: parts[0],
        time: parts[1],
        difficulty: parseInt(parts[2]),
        shares: parseInt(parts[3]),
        orphaned: parts[4],
        reward: parts[5]
    };

    var toGo = lastStats.config.depth - (lastStats.network.height - block.height);
    block.maturity = toGo < 1 ? '' : (toGo + ' to go');

    switch (block.orphaned) {
        case '0':
            block.status = 'unlocked';
            break;
        case '1':
            block.status = 'orphaned';
            break;
        default:
            block.status = 'pending';
            break;
    }

    return block;
}



function getBlockRowElement(block, jsonString) {

    var blockStatusClasses = {
        'pending': '',
        'unlocked': 'success',
        'orphaned': 'danger'
    };

    var row = document.createElement('tr');
    row.setAttribute('data-json', jsonString);
    row.setAttribute('data-height', block.height);
    row.setAttribute('id', 'blockRow' + block.height);
    row.setAttribute('title', block.hash);
    row.className = 'pending';
    //        row.className = blockStatusClasses[block.status];
    var columns =
        '<td>' + block.height + '</td>' +
        '<td>' + block.cumul_size + '</td>' +
        '<td>' + formatBlockLink(block.hash) + '</td>' +
        '<td>' + formatDate(block.timestamp) + '</td>' +
        '<td>' + block.tx_count + '</td>';

    row.innerHTML = columns;

    return row;
}


function renderBlocks(blocksResults) {

    var $blocksRows = $('#blocks_rows');

    for (var i = 0; i < blocksResults.length; i++) {

        var block = blocksResults[i];

        var blockJson = JSON.stringify(block);

        var existingRow = document.getElementById('blockRow' + block.height);

        if (existingRow && existingRow.getAttribute('data-json') !== blockJson) {
            $(existingRow).replaceWith(getBlockRowElement(block, blockJson));
        } else if (!existingRow) {

            var blockElement = getBlockRowElement(block, blockJson);

            var inserted = false;
            var rows = $blocksRows.children().get();
            for (var f = 0; f < rows.length; f++) {
                var bHeight = parseInt(rows[f].getAttribute('data-height'));
                if (bHeight < block.height) {
                    inserted = true;
                    $(rows[f]).before(blockElement);
                    break;
                }
            }
            if (!inserted)
                $blocksRows.append(blockElement);
        }

    }
}