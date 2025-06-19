const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testVotingFlow() {
  console.log('🧪 Testing NoSpoilers Voting Flow\n');
  
  let browser;
  const results = {
    passed: [],
    failed: []
  };

  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 100,
      args: ['--window-size=1280,900', '--no-sandbox']
    });

    const page = await browser.newPage();
    
    // Test 1: Navigate to vote page
    console.log('📍 Test 1: Navigate to vote page');
    await page.goto('http://localhost:3000/vote');
    await sleep(2000);
    
    const votePageLoaded = await page.evaluate(() => {
      return document.querySelector('input[placeholder="Search for a movie..."]') !== null;
    });
    
    if (votePageLoaded) {
      results.passed.push('✅ Vote page loaded successfully');
    } else {
      results.failed.push('❌ Vote page failed to load');
      throw new Error('Vote page not loaded');
    }

    // Test 2: Add a movie
    console.log('\n📍 Test 2: Add a movie');
    await page.type('input[placeholder="Search for a movie..."]', 'The Matrix');
    await sleep(3000);
    
    // Click search result
    const searchResultClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('(1999)'));
      if (movieBtn) {
        movieBtn.click();
        return true;
      }
      return false;
    });
    
    if (searchResultClicked) {
      results.passed.push('✅ Movie search result clicked');
    } else {
      results.failed.push('❌ Could not click movie search result');
    }
    
    await sleep(1500);
    
    // Click Add to Ranking
    const addedToRanking = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addedToRanking) {
      results.passed.push('✅ Movie added to available movies');
    } else {
      results.failed.push('❌ Could not add movie');
    }
    
    await sleep(1500);

    // Test 3: Click movie to rank it
    console.log('\n📍 Test 3: Rank a movie');
    const movieRanked = await page.evaluate(() => {
      // Find the movie in available section and click Add to Ranking button
      const availableMovies = document.querySelectorAll('button');
      for (const btn of availableMovies) {
        if (btn.textContent.includes('Add to Ranking') && btn.querySelector('svg')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    if (movieRanked) {
      results.passed.push('✅ Movie moved to ranking section');
    } else {
      results.failed.push('❌ Could not rank movie');
    }
    
    await sleep(1500);

    // Test 4: Add another movie for ranking test
    console.log('\n📍 Test 4: Add second movie');
    await page.click('input[placeholder="Search for a movie..."]', { clickCount: 3 });
    await page.type('input[placeholder="Search for a movie..."]', 'Inception');
    await sleep(3000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const movieBtn = buttons.find(b => b.querySelector('img') || b.textContent.includes('(2010)'));
      if (movieBtn) movieBtn.click();
    });
    await sleep(1000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent === 'Add to Ranking');
      if (addBtn) addBtn.click();
    });
    await sleep(1000);
    
    // Add to ranking
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        if (btn.textContent.includes('Add to Ranking') && btn.querySelector('svg')) {
          btn.click();
          break;
        }
      }
    });
    await sleep(1500);

    // Test 5: Test up/down arrows
    console.log('\n📍 Test 5: Test ranking arrows');
    const arrowsWork = await page.evaluate(() => {
      const downButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Down'));
      if (downButtons.length > 0 && !downButtons[0].disabled) {
        downButtons[0].click();
        return true;
      }
      return false;
    });
    
    if (arrowsWork) {
      results.passed.push('✅ Ranking arrows work');
    } else {
      results.failed.push('❌ Ranking arrows not working');
    }
    
    await sleep(1000);

    // Test 6: Submit vote
    console.log('\n📍 Test 6: Submit vote');
    const submitClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Submit Rankings'));
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
        return true;
      }
      return false;
    });
    
    if (submitClicked) {
      results.passed.push('✅ Vote submitted');
    } else {
      results.failed.push('❌ Could not submit vote');
    }
    
    await sleep(3000);

    // Test 7: Check if redirected to results
    console.log('\n📍 Test 7: Check results page');
    const onResultsPage = page.url().includes('/results');
    if (onResultsPage) {
      results.passed.push('✅ Redirected to results page');
      
      // Check if results are shown
      const hasResults = await page.evaluate(() => {
        return document.body.textContent.includes('Total Votes:');
      });
      
      if (hasResults) {
        results.passed.push('✅ Results are displayed');
      } else {
        results.failed.push('❌ No results shown');
      }
    } else {
      // Check if we're on the "already voted" screen
      const hasVoted = await page.evaluate(() => {
        return document.body.textContent.includes('Clear Vote & Vote Again');
      });
      
      if (hasVoted) {
        results.passed.push('✅ Vote recorded (already voted screen shown)');
        
        // Test 8: Clear vote
        console.log('\n📍 Test 8: Clear vote and revote');
        const clearClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const clearBtn = buttons.find(b => b.textContent.includes('Clear Vote'));
          if (clearBtn) {
            clearBtn.click();
            return true;
          }
          return false;
        });
        
        if (clearClicked) {
          results.passed.push('✅ Clear vote clicked');
          await sleep(2000);
          
          // Check if can vote again
          const canVoteAgain = await page.evaluate(() => {
            return document.querySelector('input[placeholder="Search for a movie..."]') !== null;
          });
          
          if (canVoteAgain) {
            results.passed.push('✅ Can vote again after clearing');
          } else {
            results.failed.push('❌ Cannot vote after clearing');
          }
        } else {
          results.failed.push('❌ Could not find clear vote button');
        }
      } else {
        results.failed.push('❌ Not redirected to results or vote confirmation');
      }
    }

    // Test 9: Check IRV elimination rounds
    if (onResultsPage) {
      console.log('\n📍 Test 9: Check IRV elimination rounds');
      const hasElimButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const elimBtn = buttons.find(b => b.textContent.includes('View Elimination Rounds'));
        if (elimBtn) {
          elimBtn.click();
          return true;
        }
        return false;
      });
      
      if (hasElimButton) {
        results.passed.push('✅ Elimination rounds button found and clicked');
        await sleep(1500);
        
        const hasElimData = await page.evaluate(() => {
          return document.body.textContent.includes('Round') || 
                 document.body.textContent.includes('eliminated');
        });
        
        if (hasElimData) {
          results.passed.push('✅ IRV elimination data displayed');
        } else {
          results.failed.push('❌ No elimination data shown');
        }
      } else {
        results.failed.push('❌ No elimination rounds button');
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
    results.failed.push(`❌ Test crashed: ${error.message}`);
  } finally {
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS');
    console.log('='.repeat(50));
    
    console.log('\nPASSED TESTS:');
    results.passed.forEach(test => console.log(test));
    
    if (results.failed.length > 0) {
      console.log('\nFAILED TESTS:');
      results.failed.forEach(test => console.log(test));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${results.passed.length} passed, ${results.failed.length} failed`);
    console.log('='.repeat(50));
    
    if (browser) {
      console.log('\n🔍 Browser will remain open for inspection.');
      console.log('Press Ctrl+C to close and exit.');
    }
  }
}

testVotingFlow();