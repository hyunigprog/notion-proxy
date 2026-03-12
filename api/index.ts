import { Client } from '@notionhq/client';
import cors from 'cors';
import { Request, Response } from 'express';

// Express의 Request, Response 타입을 사용하기 위해 express dependency가 필요하지만
// Vercel 환경에서는 기본적으로 express와 유사한 req, res 객체를 제공하므로
// 실제 런타임 의존성으로는 추가하지 않아도 타입 추론을 위해 @types/express를 설치하는 것이 좋습니다.
// 우선은 Any 타입으로 진행하여 간단하게 구성합니다.

const corsHandler = cors({ origin: true });

const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
});

const notionDatabaseId = process.env.NOTION_DATABASE_ID || '';

export default async function handler(req: any, res: any) {
  // Vercel의 Serverless Function은 CORS 처리를 위해 응답 헤더를 직접 설정해주는 것이 일반적입니다.
  // cors 미들웨어를 직접 실행하기보다는, 응답 헤더를 설정하는 방식으로 처리합니다.
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 또는 특정 도메인 지정
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청(pre-flight request)에 대한 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  corsHandler(req, res, async () => {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      console.error('Notion API Key or Database ID is not configured.');
      res.status(500).send('Server configuration error.');
      return;
    }

    try {
      const notionResponse = await notionClient.databases.query({
        database_id: notionDatabaseId,
      });

      const formattedData = notionResponse.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          ticker: properties.ticker?.title[0]?.plain_text || null,
          date: properties.date?.date?.start || null,
          price: properties.price?.number || null,
          quantity: properties.quantity?.number || null,
          type: properties.type?.select?.name || null,
        };
      });

      res.status(200).json(formattedData);

    } catch (error) {
      console.error('Error fetching data from Notion:', error);
      res.status(500).send('Failed to fetch data from Notion.');
    }
  });
}

// git remote add origin https://github.com/hyunigprog/notion-proxy