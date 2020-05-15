currentPage = {
    destroy: function(){
        if (xhrGetBlocks) xhrGetBlocks.abort();
    },
    init: function(){
    },
    update: function(){
        updateText('blocksTotal', lastStats.pool.totalBlocks.toString());
        updateText('blocksMaturityCount', lastStats.config.depth.toString());
        renderBlocks(lastStats.pool.blocks);
    }
};



var xhrGetBlocks;
$('#loadMoreBlocks').click(function(){
    if (xhrGetBlocks) xhrGetBlocks.abort();
    xhrGetBlocks = $.ajax({
        url: api + '/get_blocks',
        data: {
            height: $('#blocks_rows').children().last().data('height')
        },
        dataType: 'json',
        cache: 'false',
        success: function(data){
            renderBlocks(data);
        }
    });
});


function parseBlock(height, serializedBlock){
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

    switch (block.orphaned){
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



function getBlockRowElement(block, jsonString){

    function formatLuck(difficulty, shares) {
            //accurateShares is only an approximation to reverse the calcualtions done in pool.js, because the shares with their respective are not recorded in redis
            //Approximation assumes equal pool hashrate for the whole round
            //Could potentially be replaced by storing the sum of all job.difficulty in the redis db. 
            if (lastStats.config.slushMiningEnabled) {
                var accurateShares = shares / (1/lastStats.config.blockTime * (             //This uses integral calculus to calculate the "area below the graph". We need 1/blockTime for the average
                    lastStats.config.weight - lastStats.config.weight *                     //This is the integrated function of the original function sligthly modified.
                        Math.pow(                                                           //Instead of (scoreTime - dateNowSeconds) it used (x-blockTime)
                            Math.E,                                                         //This is possible because we calculated it in the intervall of 0 to blocktime
                            ((lastStats.config.blockTime * (-1)) / lastStats.config.weight)
                         )
                    )
                );
            }
            else {
                var accurateShares = shares;
            }
            if (difficulty > accurateShares){
                var percent = 100 - Math.round(accurateShares / difficulty * 100);
                return '<span class="luckGood">' + percent + '%</span>';
            }
            else{
                var percent = (100 - Math.round(difficulty / accurateShares * 100)) * -1;
                return '<span class="luckBad">' + percent + '%</span>';
            }
    }

    function formatBlockLink(hash){
        return '<a target="_blank" href="' + getBlockchainUrl(hash) + '">' + hash + '</a>';
    }

    var blockStatusClasses = {
        'pending': '',
        'unlocked': 'success',
        'orphaned': 'danger'
    };

    var row = document.createElement('tr');
    row.setAttribute('data-json', jsonString);
    row.setAttribute('data-height', block.height);
    row.setAttribute('id', 'blockRow' + block.height);
    row.setAttribute('title', block.status);
    row.className = blockStatusClasses[block.status];

    var columns =
        '<td>' + block.height + '</td>' +
        '<td>' + block.maturity + '</td>' +
        '<td>' + block.difficulty + '</td>' +
        '<td>' + formatBlockLink(block.hash) + '</td>' +
        '<td>' + formatDate(block.time) + '</td>' +
        '<td>' + formatLuck(block.difficulty, block.shares) + '</td>';

    row.innerHTML = columns;

    return row;
}


function renderBlocks(blocksResults){

    var $blocksRows = $('#blocks_rows');

    for (var i = 0; i < blocksResults.length; i += 2){

        var block = parseBlock(blocksResults[i + 1], blocksResults[i]);

        var blockJson = JSON.stringify(block);

        var existingRow = document.getElementById('blockRow' + block.height);

        if (existingRow && existingRow.getAttribute('data-json') !== blockJson){
            $(existingRow).replaceWith(getBlockRowElement(block, blockJson));
        }
        else if (!existingRow){

            var blockElement = getBlockRowElement(block, blockJson);

            var inserted = false;
            var rows = $blocksRows.children().get();
            for (var f = 0; f < rows.length; f++) {
                var bHeight = parseInt(rows[f].getAttribute('data-height'));
                if (bHeight < block.height){
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